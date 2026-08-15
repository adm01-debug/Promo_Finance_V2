import { useEffect, useMemo, useState } from "react";
import { AnomaliaPreferencesDialog } from "./AnomaliaPreferencesDialog";
import { useAnomaliasCriticasCount } from "@/hooks/useAnomaliasCriticasCount";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useAnomaliasDetectadas,
  usePendingAnomaliasQueue,
  type Anomalia,
} from "@/hooks/useAnomaliasDetectadas";
import { useAnomaliaDetectionRun } from "@/hooks/useAnomaliaDetectionRun";
import { useAnomaliasReabertasIndex } from "@/hooks/useAnomaliasReabertasIndex";
import { useRefetchAnomaliasOnFocus } from "@/hooks/useRefetchAnomaliasOnFocus";
import { DetectionRunProgress } from "./DetectionRunProgress";
import { useSincronizarAnomaliaBitrix } from "@/hooks/useSincronizarAnomaliaBitrix";
import { AnomaliasReviewQueue } from "./AnomaliasReviewQueue";
import { AnomaliaDrillDownDrawer } from "./AnomaliaDrillDownDrawer";
import { ReabrirAnomaliasLoteDialog } from "@/components/insights-ia/anomalia/ReabrirAnomaliasLoteDialog";
import { mergeLockedColumns } from "@/components/shared/ColumnVisibilityMenu.utils";
import type { SavedFilterPayload } from "@/hooks/useSavedFilters";
import { useSavedFilters } from "@/hooks/useSavedFilters";
import { useAnomaliasPanelDerivations } from "./useAnomaliasPanelDerivations";
import { AnomaliasPanelHeader } from "./AnomaliasPanelHeader";
import { AnomaliasFiltersBar } from "./AnomaliasFiltersBar";
import { AnomaliasList } from "./AnomaliasList";

import {
  COLUNAS,
  DEFAULT_FILTERS,
  DEFAULT_PAYLOAD,
  DEFAULT_VISIBLE,
  loadPersistedState,
  parseFiltersFromUrl,
  savePersistedState,
  writeFiltersToUrl,
  type AnomaliaFilters,
} from "./AnomaliasDetectadasPanel.helpers";

export function AnomaliasDetectadasPanel() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSeveridade, setReviewSeveridade] = useState<
    Anomalia["severidade"] | "todas"
  >("todas");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const { data: criticasCount = 0 } = useAnomaliasCriticasCount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Inicializa do URL primeiro (drill-down preserva o estado).
  // Se a URL não traz nada, tenta o snapshot persistido em localStorage.
  const persisted = useMemo(() => loadPersistedState(), []);
  const urlInitialFilters = useMemo(
    () => parseFiltersFromUrl(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const urlHasAnyState = useMemo(
    () =>
      Object.keys(urlInitialFilters).length > 0 ||
      searchParams.has("sort") ||
      searchParams.has("dir") ||
      searchParams.has("cols") ||
      searchParams.has("q") ||
      searchParams.has("preset"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [filters, setFilters] = useState<AnomaliaFilters>(() => {
    if (urlHasAnyState) return { ...DEFAULT_FILTERS, ...urlInitialFilters };
    if (persisted?.filters) return { ...DEFAULT_FILTERS, ...persisted.filters };
    return DEFAULT_FILTERS;
  });
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>(() => {
    if (urlHasAnyState) {
      return {
        key: searchParams.get("sort") || "detectada_em",
        dir: (searchParams.get("dir") as "asc" | "desc") || "desc",
      };
    }
    return persisted?.sort ?? { key: "detectada_em", dir: "desc" };
  });
  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    const fromUrl = searchParams.get("cols");
    if (fromUrl) return mergeLockedColumns(fromUrl.split(",").filter(Boolean), COLUNAS);
    if (!urlHasAnyState && persisted?.cols) return mergeLockedColumns(persisted.cols, COLUNAS);
    return DEFAULT_VISIBLE;
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    const fromUrl = searchParams.get("preset");
    if (fromUrl) return fromUrl;
    if (!urlHasAnyState && persisted?.presetId) return persisted.presetId;
    return null;
  });
  const [bootstrapped, setBootstrapped] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    const fromUrl = searchParams.get("q");
    if (fromUrl) return fromUrl;
    if (!urlHasAnyState && persisted?.q) return persisted.q;
    return "";
  });
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("anomalias.recent-searches");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const { defaultFilter } = useSavedFilters<AnomaliaFilters>("anomalias_detectadas");

  // Bootstrap: aplica preset padrão somente se URL e localStorage não trazem estado
  useEffect(() => {
    if (bootstrapped) return;
    if (defaultFilter && !urlHasAnyState && !persisted) {
      setFilters({ ...DEFAULT_FILTERS, ...defaultFilter.filters.filters });
      if (defaultFilter.filters.sort) setSort(defaultFilter.filters.sort);
      if (defaultFilter.filters.columns)
        setVisibleCols(mergeLockedColumns(defaultFilter.filters.columns, COLUNAS));
      setActivePresetId(defaultFilter.id);
    }
    setBootstrapped(true);
  }, [defaultFilter, bootstrapped, urlHasAnyState, persisted]);

  // Persiste filtros/sort/colunas/busca/preset na URL e em localStorage
  useEffect(() => {
    if (!bootstrapped) return;
    const next = writeFiltersToUrl(
      searchParams,
      filters,
      sort,
      visibleCols,
      searchTerm,
      activePresetId,
    );
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    savePersistedState({
      filters,
      sort,
      cols: visibleCols,
      q: searchTerm,
      presetId: activePresetId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, visibleCols, searchTerm, activePresetId, bootstrapped]);

  // Salva o search atual para restaurar após drill-down
  useEffect(() => {
    if (!bootstrapped) return;
    window.sessionStorage.setItem(
      "anomalias-panel:last-search",
      window.location.search ?? "",
    );
  }, [searchParams, bootstrapped]);

  const { data, isLoading, atualizarStatus } = useAnomaliasDetectadas(
    filters.status === "todas" ? undefined : filters.status,
  );
  useRefetchAnomaliasOnFocus();
  const { activeRun, disparar, disparando } = useAnomaliaDetectionRun();
  const sincronizar = useSincronizarAnomaliaBitrix();
  const { data: pendentes = [] } = usePendingAnomaliasQueue();

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [reabrirLoteOpen, setReabrirLoteOpen] = useState(false);

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const limparSelecao = () => setSelecionados(new Set());

  const { data: reabertasIndex } = useAnomaliasReabertasIndex();

  const {
    listaBase,
    lista,
    pendentesPorSev,
    profilesMap,
    exportColumns,
    exportMeta,
    severityPreview,
    searchSuggestions,
    scopeLabel,
    activeFilterCount,
  } = useAnomaliasPanelDerivations({
    data,
    filters,
    sort,
    searchTerm,
    visibleCols,
    activePresetId,
    pendentes,
    reabertasIndex,
    recentSearches,
  });

  const currentState: SavedFilterPayload<AnomaliaFilters> = useMemo(
    () => ({ v: 1, filters, sort, columns: visibleCols }),
    [filters, sort, visibleCols],
  );

  // Persiste termos pesquisados (apenas quando aplicados e não vazios)
  useEffect(() => {
    const term = searchTerm.trim();
    if (!term || term.length < 2) return;
    setRecentSearches((prev) => {
      const next = [term, ...prev.filter((p) => p !== term)].slice(0, 8);
      try {
        localStorage.setItem("anomalias.recent-searches", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [searchTerm]);

  const handleLoadPreset = (preset: {
    id: string;
    payload: SavedFilterPayload<AnomaliaFilters>;
  }) => {
    setFilters({ ...DEFAULT_FILTERS, ...preset.payload.filters });
    if (preset.payload.sort) setSort(preset.payload.sort);
    if (preset.payload.columns)
      setVisibleCols(mergeLockedColumns(preset.payload.columns, COLUNAS));
    setActivePresetId(preset.id);
  };

  const handleClearPreset = () => {
    setActivePresetId(null);
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_PAYLOAD.sort!);
    setVisibleCols(DEFAULT_VISIBLE);
    setSearchTerm("");
  };

  const isVisible = (k: string) => visibleCols.includes(k);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <AnomaliasPanelHeader
            criticasCount={criticasCount}
            reviewSeveridade={reviewSeveridade}
            onReviewSeveridadeChange={setReviewSeveridade}
            pendentesPorSev={pendentesPorSev}
            onOpenReview={() => setReviewOpen(true)}
            onOpenPrefs={() => setPrefsOpen(true)}
            onDetectar={() => disparar()}
            disparando={disparando}
            activeRun={activeRun}
          />

          {activeRun && <DetectionRunProgress run={activeRun} />}

          <AnomaliasFiltersBar
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            visibleCols={visibleCols}
            setVisibleCols={setVisibleCols}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activePresetId={activePresetId}
            setActivePresetId={setActivePresetId}
            currentState={currentState}
            listaLength={lista.length}
            listaBaseLength={listaBase.length}
            severityPreview={severityPreview}
            searchSuggestions={searchSuggestions}
            scopeLabel={scopeLabel}
            activeFilterCount={activeFilterCount}
            reabertasIndex={reabertasIndex}
            exportRows={lista}
            exportColumns={exportColumns}
            exportMeta={exportMeta}
            onLoadPreset={handleLoadPreset}
            onClearPreset={handleClearPreset}
          />
        </CardHeader>
        <CardContent>
          <AnomaliasList
            lista={lista}
            isLoading={isLoading}
            isVisible={isVisible}
            profilesMap={profilesMap}
            selecionados={selecionados}
            toggleSelecionado={toggleSelecionado}
            limparSelecao={limparSelecao}
            setSelecionados={setSelecionados}
            onOpenReabrirLote={() => setReabrirLoteOpen(true)}
            atualizarStatus={atualizarStatus}
            sincronizar={sincronizar}
            onInvestigarNavigate={(id) =>
              navigate(`/admin/insights-ia/anomalia/${id}`)
            }
          />
        </CardContent>
      </Card>
      <ReabrirAnomaliasLoteDialog
        open={reabrirLoteOpen}
        onOpenChange={setReabrirLoteOpen}
        ids={Array.from(selecionados)}
        onConcluido={limparSelecao}
      />
      <AnomaliasReviewQueue
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        severidadeFilter={reviewSeveridade}
      />
      <AnomaliaPreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
      <AnomaliaDrillDownDrawer />
    </div>
  );
}
