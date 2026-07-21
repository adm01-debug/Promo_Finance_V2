import { useEffect, useMemo, useState } from "react";
import { AnomaliaPreferencesDialog } from "./AnomaliaPreferencesDialog";
import { BellOff } from "lucide-react";
import { useAnomaliasCriticasCount } from "@/hooks/useAnomaliasCriticasCount";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Eye,
  RefreshCw,
  Microscope,
  ListChecks,
  Filter,
  ArrowUpDown,
  RotateCcw,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { ReabrirAnomaliaDialog } from "@/components/insights-ia/anomalia/ReabrirAnomaliaDialog";
import { ReabrirAnomaliasLoteDialog } from "@/components/insights-ia/anomalia/ReabrirAnomaliasLoteDialog";
import { dispatchOpenAnomaliaDrawer } from "@/lib/anomalia-routes";
import { SavedFiltersBar } from "@/components/shared/SavedFiltersBar";
import {
  AdvancedSearchPopover,
  type SearchSuggestion,
  type SeverityPreview,
} from "@/components/shared/AdvancedSearchPopover";
import {
  ViewExportButton,
  type ViewExportColumn,
} from "@/components/shared/ViewExportButton";
import {
  ColumnVisibilityMenu,
  mergeLockedColumns,
  type ColumnDef,
} from "@/components/shared/ColumnVisibilityMenu";
import type { SavedFilterPayload } from "@/hooks/useSavedFilters";
import { useSavedFilters } from "@/hooks/useSavedFilters";
import { formatProfileLabel } from "@/hooks/useProfilesByIds";
import { useAnomaliasPanelDerivations } from "./useAnomaliasPanelDerivations";


import {
  severidadeBadge,
  SEV_RANK,
  TIPO_LABEL,
  SEVERIDADES,
  TIPOS,
  type AnomaliaFilters,
  ENTITY_TYPE,
  COLUNAS,
  SORT_OPTIONS,
  DEFAULT_FILTERS,
  DEFAULT_VISIBLE,
  DEFAULT_PAYLOAD,
  parseFiltersFromUrl,
  writeFiltersToUrl,
  PERSIST_KEY,
  type PersistedState,
  loadPersistedState,
  savePersistedState,
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
    // só interessa o snapshot inicial — não recomputar a cada mudança
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
    if (urlHasAnyState) {
      return { ...DEFAULT_FILTERS, ...urlInitialFilters };
    }
    if (persisted?.filters) {
      return { ...DEFAULT_FILTERS, ...persisted.filters };
    }
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
    if (fromUrl) {
      return mergeLockedColumns(fromUrl.split(",").filter(Boolean), COLUNAS);
    }
    if (!urlHasAnyState && persisted?.cols) {
      return mergeLockedColumns(persisted.cols, COLUNAS);
    }
    return DEFAULT_VISIBLE;
  });
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    // Inicializa do URL primeiro, com fallback para o snapshot persistido.
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

  const { defaultFilter } = useSavedFilters<AnomaliaFilters>(ENTITY_TYPE);

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

  // Salva o search atual para que a página de drill-down possa restaurar
  // o painel com os mesmos filtros/ordenação ao clicar em "Voltar para a lista".
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
  // Revalida a lista quando o usuário volta da tela completa da entidade
  useRefetchAnomaliasOnFocus();
  const { activeRun, disparar, disparando } = useAnomaliaDetectionRun();
  const sincronizar = useSincronizarAnomaliaBitrix();
  const { data: pendentes = [] } = usePendingAnomaliasQueue();

  // Seleção em lote para reabertura de anomalias confirmadas/falso_positivo
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

  // Index de anomalias reabertas (audit_logs com REOPEN/REOPEN_BATCH)
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
          <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Anomalias detectadas
              {criticasCount > 0 && (
                <Badge variant="destructive" className="ml-1" aria-live="polite">
                  {criticasCount} crítica{criticasCount > 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1">
                <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Revisar:
                </span>
                <Select
                  value={reviewSeveridade}
                  onValueChange={(v) =>
                    setReviewSeveridade(v as Anomalia["severidade"] | "todas")
                  }
                >
                  <SelectTrigger
                    className="h-7 w-32 border-0 bg-transparent px-1 text-xs focus:ring-0"
                    aria-label="Filtrar fila por severidade"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">
                      Todas ({pendentesPorSev.todas})
                    </SelectItem>
                    <SelectItem value="critica">
                      Crítica ({pendentesPorSev.critica})
                    </SelectItem>
                    <SelectItem value="alta">
                      Alta ({pendentesPorSev.alta})
                    </SelectItem>
                    <SelectItem value="media">
                      Média ({pendentesPorSev.media})
                    </SelectItem>
                    <SelectItem value="baixa">
                      Baixa ({pendentesPorSev.baixa})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 px-2 text-xs"
                  disabled={
                    (reviewSeveridade === "todas"
                      ? pendentesPorSev.todas
                      : pendentesPorSev[reviewSeveridade]) === 0
                  }
                  onClick={() => setReviewOpen(true)}
                >
                  Iniciar
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPrefsOpen(true)}
                title="Preferências de alerta"
              >
                <BellOff className="h-3 w-3 mr-1" />
                Preferências
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => disparar()}
                disabled={disparando || !!activeRun}
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${disparando || activeRun ? "animate-spin" : ""}`}
                />
                {activeRun ? "Detecção em andamento…" : "Detectar agora"}
              </Button>
            </div>
          </div>

          {activeRun && <DetectionRunProgress run={activeRun} />}

          <div className="flex flex-wrap items-center gap-2">
            <SavedFiltersBar
              entityType={ENTITY_TYPE}
              currentState={currentState}
              activePresetId={activePresetId}
              onLoad={handleLoadPreset}
              onClear={handleClearPreset}
              onRestoreState={({ presetId, payload }) => {
                // Reaplica o estado anterior preservando o activePresetId (inclusive null).
                setFilters({ ...DEFAULT_FILTERS, ...payload.filters });
                if (payload.sort) setSort(payload.sort);
                if (payload.columns)
                  setVisibleCols(mergeLockedColumns(payload.columns, COLUNAS));
                setActivePresetId(presetId);
              }}
            />

            <AdvancedSearchPopover
              value={searchTerm}
              onApply={setSearchTerm}
              totalPreview={lista.length}
              severityPreview={severityPreview}
              suggestions={searchSuggestions}
              scopeLabel={scopeLabel}
              placeholder="Buscar em descrição, tipo, observações…"
            />

            <Select
              value={filters.status}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  status: v as AnomaliaFilters["status"],
                }))
              }
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nova">Novas</SelectItem>
                <SelectItem value="investigando">Investigando</SelectItem>
                <SelectItem value="confirmada">Confirmadas</SelectItem>
                <SelectItem value="falso_positivo">Falsos positivos</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  Severidade
                  {filters.severidades.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {filters.severidades.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs">
                  Severidades
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SEVERIDADES.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={filters.severidades.includes(s)}
                    onCheckedChange={(v) =>
                      setFilters((f) => ({
                        ...f,
                        severidades: v
                          ? [...f.severidades, s]
                          : f.severidades.filter((x) => x !== s),
                      }))
                    }
                    onSelect={(e) => e.preventDefault()}
                    className="capitalize"
                  >
                    {s}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  Tipo
                  {filters.tipos.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {filters.tipos.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-xs">Tipos</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TIPOS.map((t) => (
                  <DropdownMenuCheckboxItem
                    key={t}
                    checked={filters.tipos.includes(t)}
                    onCheckedChange={(v) =>
                      setFilters((f) => ({
                        ...f,
                        tipos: v
                          ? [...f.tipos, t]
                          : f.tipos.filter((x) => x !== t),
                      }))
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {TIPO_LABEL[t]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={filters.periodoInicio}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, periodoInicio: e.target.value }))
                }
                className="h-9 w-36"
                aria-label="Período início"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="date"
                value={filters.periodoFim}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, periodoFim: e.target.value }))
                }
                className="h-9 w-36"
                aria-label="Período fim"
              />
            </div>

            <Button
              type="button"
              variant={filters.apenasReabertas ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() =>
                setFilters((f) => ({ ...f, apenasReabertas: !f.apenasReabertas }))
              }
              aria-pressed={filters.apenasReabertas}
              title="Mostrar apenas anomalias que já foram reabertas"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Apenas reabertas
              {filters.apenasReabertas && reabertasIndex && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {listaBase.length}
                </Badge>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Ordenar:{" "}
                  {SORT_OPTIONS.find((o) => o.key === sort.key)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">
                  Ordenar por
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SORT_OPTIONS.map((o) => (
                  <DropdownMenuCheckboxItem
                    key={o.key}
                    checked={sort.key === o.key}
                    onCheckedChange={() =>
                      setSort((s) => ({ key: o.key, dir: s.dir }))
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {o.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={sort.dir === "desc"}
                  onCheckedChange={() =>
                    setSort((s) => ({
                      ...s,
                      dir: s.dir === "asc" ? "desc" : "asc",
                    }))
                  }
                  onSelect={(e) => e.preventDefault()}
                >
                  Descendente
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ColumnVisibilityMenu
              columns={COLUNAS}
              visible={visibleCols}
              onChange={setVisibleCols}
            />

            <ViewExportButton
              filename="anomalias_visualizacao"
              title="Anomalias detectadas — visualização atual"
              rows={lista}
              columns={exportColumns}
              meta={exportMeta}
            />

            {activeFilterCount > 0 && (
              <Badge variant="outline" className="h-7 px-2">
                {activeFilterCount} filtro
                {activeFilterCount > 1 ? "s" : ""} ativo
                {activeFilterCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const idsReabriveis = lista
              .filter(
                (a) => a.status === "confirmada" || a.status === "falso_positivo",
              )
              .map((a) => a.id);
            const setReabriveis = new Set(idsReabriveis);
            const selecionadosVisiveis = idsReabriveis.filter((id) =>
              selecionados.has(id),
            );
            const allSelected =
              idsReabriveis.length > 0 &&
              selecionadosVisiveis.length === idsReabriveis.length;
            const someSelected =
              selecionadosVisiveis.length > 0 && !allSelected;
            const handleToggleAll = () => {
              if (allSelected) {
                // deseleciona apenas os reabríveis visíveis
                setSelecionados((prev) => {
                  const next = new Set(prev);
                  idsReabriveis.forEach((id) => next.delete(id));
                  return next;
                });
              } else {
                setSelecionados((prev) => {
                  const next = new Set(prev);
                  idsReabriveis.forEach((id) => next.add(id));
                  return next;
                });
              }
            };

            return (
              <>
                {idsReabriveis.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded-md border border-border bg-muted/40">
                    <Checkbox
                      id="anomalias-select-all"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={handleToggleAll}
                      aria-label="Selecionar todas as anomalias reabríveis visíveis"
                    />
                    <label
                      htmlFor="anomalias-select-all"
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                    >
                      {selecionadosVisiveis.length > 0
                        ? `${selecionadosVisiveis.length} de ${idsReabriveis.length} selecionada(s) para reabertura`
                        : `Selecionar para reabrir em lote (${idsReabriveis.length} reabrível${idsReabriveis.length === 1 ? "" : "is"})`}
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      {selecionadosVisiveis.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={limparSelecao}
                        >
                          <X className="h-3 w-3 mr-1" /> Limpar seleção
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={selecionadosVisiveis.length === 0}
                        onClick={() => setReabrirLoteOpen(true)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reabrir {selecionadosVisiveis.length || ""} em lote
                      </Button>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : lista.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    ✓ Nenhuma anomalia neste filtro.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lista.map((a) => {
                      const podeSelecionar = setReabriveis.has(a.id);
                      const selecionado = selecionados.has(a.id);
                      return (
                        <div
                          key={a.id}
                          className={`p-3 rounded-md border bg-card flex items-start justify-between gap-3 ${
                            selecionado ? "border-primary/60 ring-1 ring-primary/30" : ""
                          }`}
                        >
                          {podeSelecionar && (
                            <Checkbox
                              checked={selecionado}
                              onChange={() => toggleSelecionado(a.id)}
                              className="mt-1 shrink-0"
                              aria-label={`Selecionar anomalia ${a.descricao}`}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={severidadeBadge(a.severidade)}>
                        {a.severidade}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {TIPO_LABEL[a.tipo_anomalia]}
                      </Badge>
                      {isVisible("data") && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.detectada_em).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{a.descricao}</p>
                    {isVisible("observacoes") && a.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {a.observacoes}
                      </p>
                    )}
                    {(a.status === "confirmada" ||
                      a.status === "falso_positivo") &&
                      a.resolvida_por && (
                        <p
                          className="text-[11px] text-muted-foreground mt-1"
                          title={
                            profilesMap?.get(a.resolvida_por)?.email ?? undefined
                          }
                        >
                          {a.status === "confirmada"
                            ? "Confirmada"
                            : "Marcada falso positivo"}{" "}
                          por{" "}
                          <span className="font-medium text-foreground">
                            {formatProfileLabel(
                              profilesMap?.get(a.resolvida_por),
                            )}
                          </span>
                          {a.resolvida_em && (
                            <>
                              {" · "}
                              {new Date(a.resolvida_em).toLocaleString("pt-BR")}
                            </>
                          )}
                        </p>
                      )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => dispatchOpenAnomaliaDrawer(a.id)}
                    >
                      <Microscope className="h-3 w-3 mr-1" /> Drill-down
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to={`/admin/insights-ia/anomalia/${a.id}`}
                        target="_blank"
                      >
                        <Microscope className="h-3 w-3 mr-1" /> Nova aba
                      </Link>
                    </Button>
                  </div>
                  {isVisible("acoes_inline") && a.status === "nova" && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          atualizarStatus.mutate({
                            id: a.id,
                            status: "investigando",
                          });
                          navigate(`/admin/insights-ia/anomalia/${a.id}`);
                        }}
                        disabled={atualizarStatus.isPending}
                      >
                        <Search className="h-3 w-3 mr-1" /> Investigar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          atualizarStatus.mutate(
                            { id: a.id, status: "falso_positivo" },
                            {
                              onSuccess: () =>
                                sincronizar.mutate({
                                  anomaliaId: a.id,
                                  evento: "falso_positivo",
                                }),
                            },
                          )
                        }
                      >
                        <Eye className="h-3 w-3 mr-1" /> Falso +
                      </Button>
                    </div>
                  )}
                  {isVisible("acoes_inline") &&
                    a.status === "investigando" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          atualizarStatus.mutate(
                            { id: a.id, status: "confirmada" },
                            {
                              onSuccess: () =>
                                sincronizar.mutate({
                                  anomaliaId: a.id,
                                  evento: "confirmada",
                                }),
                            },
                          )
                        }
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                      </Button>
                    )}
                  {isVisible("acoes_inline") &&
                    (a.status === "confirmada" ||
                      a.status === "falso_positivo") && (
                      <ReabrirAnomaliaDialog anomaliaId={a.id} />
                    )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
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
