import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Layers } from 'lucide-react';

export interface HeatmapPoint {
  id: string;
  lat: number;
  lng: number;
  cost: number;
  status: string;
  customer: string;
}

interface Props {
  points: HeatmapPoint[];
  loading?: boolean;
}

type ViewMode = 'heatmap' | 'cluster';

const BR_CENTER: [number, number] = [-46.6333, -23.5505]; // SP fallback

/**
 * Mapa Mapbox com dois modos: heatmap de densidade e clusters navegáveis.
 * Token é obtido via edge function `get-mapbox-token`.
 */
export function DeliveryHeatmap({ points, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('heatmap');

  // Filtra pontos válidos (lat/lng dentro dos limites)
  const validPoints = useMemo(
    () =>
      points.filter(
        (p) =>
          typeof p.lat === 'number' &&
          typeof p.lng === 'number' &&
          Number.isFinite(p.lat) &&
          Number.isFinite(p.lng) &&
          Math.abs(p.lat) <= 90 &&
          Math.abs(p.lng) <= 180,
      ),
    [points],
  );

  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: 'FeatureCollection',
      features: validPoints.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { id: p.id, cost: p.cost, status: p.status, customer: p.customer },
      })),
    }),
    [validPoints],
  );

  // Carrega o token
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (cancelled) return;
        if (error) throw error;
        const t = (data as { token?: string })?.token;
        if (!t) throw new Error('token vazio');
        setToken(t);
      } catch (e) {
        if (!cancelled) setTokenError(e instanceof Error ? e.message : 'Falha ao carregar token');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Inicializa mapa
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: BR_CENTER,
      zoom: 4,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');
    map.on('load', () => {
      map.addSource('deliveries', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Heatmap layer
      map.addLayer({
        id: 'deliveries-heat',
        type: 'heatmap',
        source: 'deliveries',
        maxzoom: 15,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'cost'], 0, 0.2, 500, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 6, 15, 30],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 12, 1, 15, 0.4],
        },
      });

      // Cluster layers
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'deliveries',
        filter: ['has', 'point_count'],
        layout: { visibility: 'none' },
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#3b82f6', 20, '#f59e0b', 100, '#ef4444'],
          'circle-radius': ['step', ['get', 'point_count'], 16, 20, 22, 100, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'deliveries',
        filter: ['has', 'point_count'],
        layout: {
          visibility: 'none',
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      });
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'deliveries',
        filter: ['!', ['has', 'point_count']],
        layout: { visibility: 'none' },
        paint: {
          'circle-color': '#3b82f6',
          'circle-radius': 6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Popup ao clicar em ponto isolado
      map.on('click', 'unclustered-point', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
        const p = f.properties as { customer: string; status: string; cost: number };
        new mapboxgl.Popup()
          .setLngLat([lng, lat])
          .setHTML(
            `<div style="font-size:12px"><strong>${p.customer || 'Cliente'}</strong><br/>${p.status}<br/>R$ ${Number(p.cost).toFixed(2)}</div>`,
          )
          .addTo(map);
      });
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource('deliveries') as mapboxgl.GeoJSONSource;
        if (clusterId != null) {
          source.getClusterExpansionZoom(clusterId).then((zoom) => {
            map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
          }).catch(() => {});
        }
      });
      map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualiza dados quando pontos mudam
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource('deliveries') as mapboxgl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData(geojson);
      // Ajusta bounds
      if (validPoints.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        validPoints.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 40, maxZoom: 12, duration: 600 });
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [geojson, validPoints]);

  // Alterna modo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const heat = mode === 'heatmap' ? 'visible' : 'none';
    const cluster = mode === 'cluster' ? 'visible' : 'none';
    try {
      map.setLayoutProperty('deliveries-heat', 'visibility', heat);
      map.setLayoutProperty('clusters', 'visibility', cluster);
      map.setLayoutProperty('cluster-count', 'visibility', cluster);
      map.setLayoutProperty('unclustered-point', 'visibility', cluster);
    } catch {
      // camadas ainda não carregadas
    }
  }, [mode]);

  if (loading && !token) {
    return <Skeleton className="h-[480px] w-full" />;
  }

  if (tokenError) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Não foi possível carregar o mapa: {tokenError}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-3 z-10 flex gap-2 rounded-md bg-background/95 p-1 shadow-md backdrop-blur">
        <Button
          size="sm"
          variant={mode === 'heatmap' ? 'default' : 'ghost'}
          onClick={() => setMode('heatmap')}
          aria-label="Modo heatmap"
        >
          <Flame className="mr-1 h-4 w-4" /> Heatmap
        </Button>
        <Button
          size="sm"
          variant={mode === 'cluster' ? 'default' : 'ghost'}
          onClick={() => setMode('cluster')}
          aria-label="Modo cluster"
        >
          <Layers className="mr-1 h-4 w-4" /> Clusters
        </Button>
      </div>
      <div className="absolute right-3 top-3 z-10 rounded-md bg-background/95 px-2 py-1 text-xs text-muted-foreground shadow">
        {validPoints.length} de {points.length} pontos geolocalizados
      </div>
      <div ref={containerRef} className="h-[480px] w-full overflow-hidden rounded-md border" />
    </div>
  );
}
