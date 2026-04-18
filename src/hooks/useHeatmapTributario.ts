import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CelulaHeatmap {
  mes: number;
  tributo: string;
  valor: number;
  intensidade: number;
  variacao_mom: number | null;
}

export interface HeatmapResponse {
  success: boolean;
  ano: number;
  empresa_id: string;
  celulas: CelulaHeatmap[];
  total_por_mes: number[];
  total_ano: number;
  max_valor: number;
  insights: { mes_pico: number; mes_vale: number | null };
}

export function useHeatmapTributario(empresaId?: string, ano?: number) {
  return useQuery({
    queryKey: ['heatmap-tributario', empresaId, ano],
    queryFn: async (): Promise<HeatmapResponse | null> => {
      if (!empresaId || !ano) return null;
      const { data, error } = await supabase.functions.invoke('gerar-heatmap-tributario', {
        body: { empresa_id: empresaId, ano },
      });
      if (error) throw error;
      return data as HeatmapResponse;
    },
    enabled: !!empresaId && !!ano,
    staleTime: 10 * 60 * 1000,
  });
}
