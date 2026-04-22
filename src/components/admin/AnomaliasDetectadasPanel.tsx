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
import {
  useProfilesByIds,
  formatProfileLabel,
} from "@/hooks/useProfilesByIds";

function severidadeBadge(s: Anomalia["severidade"]) {
  if (s === "critica" || s === "alta") return "destructive";
  if (s === "media") return "secondary";
  return "outline";
}

const SEV_RANK: Record<Anomalia["severidade"], number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

const TIPO_LABEL: Record<Anomalia["tipo_anomalia"], string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

const SEVERIDADES: Anomalia["severidade"][] = [
  "critica",
  "alta",
  "media",
  "baixa",
];
const TIPOS = Object.keys(TIPO_LABEL) as Anomalia["tipo_anomalia"][];

interface AnomaliaFilters {
  status: Anomalia["status"] | "todas";
  severidades: Anomalia["severidade"][];
  tipos: Anomalia["tipo_anomalia"][];
  periodoInicio: string;
  periodoFim: string;
}

const ENTITY_TYPE = "anomalias_detectadas";

const COLUNAS: ColumnDef[] = [
  { key: "severidade", label: "Severidade", locked: true },
  { key: "tipo", label: "Tipo", locked: true },
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição", locked: true },
  { key: "observacoes", label: "Observações" },
  { key: "acoes_inline", label: "Ações inline" },
];

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "detectada_em", label: "Data de detecção" },
  { key: "severidade", label: "Severidade" },
  { key: "tipo_anomalia", label: "Tipo de anomalia" },
];

const DEFAULT_FILTERS: AnomaliaFilters = {
  status: "nova",
  severidades: [],
  tipos: [],
  periodoInicio: "",
  periodoFim: "",
};
const DEFAULT_VISIBLE = COLUNAS.map((c) => c.key);
const DEFAULT_PAYLOAD: SavedFilterPayload<AnomaliaFilters> = {
  v: 1,
  filters: DEFAULT_FILTERS,
  sort: { key: "detectada_em", dir: "desc" },
  columns: DEFAULT_VISIBLE,
};

function parseFiltersFromUrl(sp: URLSearchParams): Partial<AnomaliaFilters> {
  const out: Partial<AnomaliaFilters> = {};
  const status = sp.get("status");
  if (status) out.status = status as AnomaliaFilters["status"];
  const sev = sp.get("sev");
  if (sev)
    out.severidades = sev
      .split(",")
      .filter(Boolean) as Anomalia["severidade"][];
  const tipos = sp.get("tipos");
  if (tipos)
    out.tipos = tipos
      .split(",")
      .filter(Boolean) as Anomalia["tipo_anomalia"][];
  const ini = sp.get("ini");
  if (ini) out.periodoInicio = ini;
  const fim = sp.get("fim");
  if (fim) out.periodoFim = fim;
  return out;
}

function writeFiltersToUrl(
  sp: URLSearchParams,
  f: AnomaliaFilters,
  s: { key: string; dir: "asc" | "desc" },
): URLSearchParams {
  const next = new URLSearchParams(sp);
  const setOrDel = (k: string, v: string) => {
    if (v) next.set(k, v);
    else next.delete(k);
  };
  setOrDel("status", f.status !== "nova" ? f.status : "");
  setOrDel("sev", f.severidades.join(","));
  setOrDel("tipos", f.tipos.join(","));
  setOrDel("ini", f.periodoInicio);
  setOrDel("fim", f.periodoFim);
  setOrDel("sort", s.key !== "detectada_em" ? s.key : "");
  setOrDel("dir", s.dir !== "desc" ? s.dir : "");
  return next;
}

export function AnomaliasDetectadasPanel() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSeveridade, setReviewSeveridade] = useState<
    Anomalia["severidade"] | "todas"
  >("todas");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const { data: criticasCount = 0 } = useAnomaliasCriticasCount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Inicializa do URL primeiro (drill-down preserva o estado)
  const [filters, setFilters] = useState<AnomaliaFilters>(() => ({
    ...DEFAULT_FILTERS,
    ...parseFiltersFromUrl(searchParams),
  }));
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>(
    () => ({
      key: searchParams.get("sort") || "detectada_em",
      dir: (searchParams.get("dir") as "asc" | "desc") || "desc",
    }),
  );
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("anomalias.recent-searches");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const { defaultFilter } = useSavedFilters<AnomaliaFilters>(ENTITY_TYPE);

  // Bootstrap: aplica preset padrão somente se a URL não traz filtros
  useEffect(() => {
    if (bootstrapped) return;
    const urlHasFilters = Object.keys(parseFiltersFromUrl(searchParams)).length > 0;
    if (defaultFilter && !urlHasFilters) {
      setFilters({ ...DEFAULT_FILTERS, ...defaultFilter.filters.filters });
      if (defaultFilter.filters.sort) setSort(defaultFilter.filters.sort);
      if (defaultFilter.filters.columns)
        setVisibleCols(mergeLockedColumns(defaultFilter.filters.columns, COLUNAS));
      setActivePresetId(defaultFilter.id);
    }
    setBootstrapped(true);
  }, [defaultFilter, bootstrapped, searchParams]);

  // Persiste filtros/sort na URL para sobreviverem ao drill-down
  useEffect(() => {
    if (!bootstrapped) return;
    const next = writeFiltersToUrl(searchParams, filters, sort);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort, bootstrapped]);

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

  // Lista filtrada SEM o termo de busca — usada para gerar sugestões e prévias
  const listaBase = useMemo(() => {
    let arr = data ?? [];
    if (filters.severidades.length > 0)
      arr = arr.filter((a) => filters.severidades.includes(a.severidade));
    if (filters.tipos.length > 0)
      arr = arr.filter((a) => filters.tipos.includes(a.tipo_anomalia));
    if (filters.periodoInicio) {
      const ini = new Date(filters.periodoInicio).getTime();
      arr = arr.filter((a) => new Date(a.detectada_em).getTime() >= ini);
    }
    if (filters.periodoFim) {
      const fim = new Date(filters.periodoFim).getTime() + 86_400_000;
      arr = arr.filter((a) => new Date(a.detectada_em).getTime() <= fim);
    }
    return arr;
  }, [data, filters]);

  const lista = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let arr = listaBase;
    if (term) {
      arr = arr.filter((a) => {
        const tipoLabel = (TIPO_LABEL[a.tipo_anomalia] ?? "").toLowerCase();
        return (
          (a.descricao ?? "").toLowerCase().includes(term) ||
          (a.observacoes ?? "").toLowerCase().includes(term) ||
          a.tipo_anomalia.toLowerCase().includes(term) ||
          tipoLabel.includes(term) ||
          a.severidade.toLowerCase().includes(term)
        );
      });
    }
    const sorted = [...arr].sort((a, b) => {
      let cmp = 0;
      if (sort.key === "severidade") {
        cmp = SEV_RANK[a.severidade] - SEV_RANK[b.severidade];
      } else if (sort.key === "tipo_anomalia") {
        cmp = a.tipo_anomalia.localeCompare(b.tipo_anomalia);
      } else {
        cmp =
          new Date(a.detectada_em).getTime() -
          new Date(b.detectada_em).getTime();
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [listaBase, searchTerm, sort]);

  // Contagem da fila pendente por severidade (para o seletor de revisão)
  const pendentesPorSev = useMemo(() => {
    const acc: Record<Anomalia["severidade"] | "todas", number> = {
      todas: pendentes.length,
      critica: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    };
    for (const a of pendentes) acc[a.severidade] += 1;
    return acc;
  }, [pendentes]);

  // Resolve nomes/emails de quem revisou as anomalias visíveis
  const { data: profilesMap } = useProfilesByIds(
    lista.map((a) => a.resolvida_por),
  );

  const currentState: SavedFilterPayload<AnomaliaFilters> = useMemo(
    () => ({ v: 1, filters, sort, columns: visibleCols }),
    [filters, sort, visibleCols],
  );

  const exportColumns = useMemo<ViewExportColumn<Anomalia>[]>(() => {
    const all: ViewExportColumn<Anomalia>[] = [
      { key: "severidade", header: "Severidade", accessor: (a) => a.severidade },
      {
        key: "tipo",
        header: "Tipo",
        accessor: (a) => TIPO_LABEL[a.tipo_anomalia] ?? a.tipo_anomalia,
      },
      {
        key: "data",
        header: "Detectada em",
        accessor: (a) => new Date(a.detectada_em).toLocaleString("pt-BR"),
      },
      { key: "descricao", header: "Descrição", accessor: (a) => a.descricao ?? "" },
      {
        key: "observacoes",
        header: "Observações",
        accessor: (a) => a.observacoes ?? "",
      },
    ];
    // Status e auditoria sempre úteis para auditoria, mesmo que coluna não esteja visível
    const auditCols: ViewExportColumn<Anomalia>[] = [
      { key: "status", header: "Status", accessor: (a) => a.status },
      {
        key: "resolvida_por",
        header: "Resolvida por",
        accessor: (a) =>
          a.resolvida_por
            ? formatProfileLabel(profilesMap?.get(a.resolvida_por))
            : "",
      },
      {
        key: "resolvida_em",
        header: "Resolvida em",
        accessor: (a) =>
          a.resolvida_em ? new Date(a.resolvida_em).toLocaleString("pt-BR") : "",
      },
    ];
    return [...all.filter((c) => visibleCols.includes(c.key)), ...auditCols];
  }, [visibleCols, profilesMap]);

  const exportMeta = useMemo(() => {
    const sortLabel = SORT_OPTIONS.find((o) => o.key === sort.key)?.label ?? sort.key;
    return {
      ordenacao: `${sortLabel} (${sort.dir === "asc" ? "asc" : "desc"})`,
      periodo:
        filters.periodoInicio || filters.periodoFim
          ? `${filters.periodoInicio || "—"} até ${filters.periodoFim || "—"}`
          : "Sem período definido",
      filtros: {
        Status: filters.status,
        Severidades: filters.severidades.join(", ") || "todas",
        Tipos:
          filters.tipos.map((t) => TIPO_LABEL[t]).join(", ") || "todos",
        Colunas: visibleCols.join(", "),
      },
    };
  }, [filters, sort, visibleCols]);

  // Prévia por severidade — calculada a partir de listaBase (ignora termo)
  // mostra o impacto que a busca aplicaria sobre o conjunto pré-filtrado
  const severityPreview = useMemo<SeverityPreview[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    const source = term
      ? listaBase.filter((a) => {
          const tipoLabel = (TIPO_LABEL[a.tipo_anomalia] ?? "").toLowerCase();
          return (
            (a.descricao ?? "").toLowerCase().includes(term) ||
            (a.observacoes ?? "").toLowerCase().includes(term) ||
            a.tipo_anomalia.toLowerCase().includes(term) ||
            tipoLabel.includes(term) ||
            a.severidade.toLowerCase().includes(term)
          );
        })
      : listaBase;
    const counts: Record<Anomalia["severidade"], number> = {
      critica: 0,
      alta: 0,
      media: 0,
      baixa: 0,
    };
    for (const a of source) counts[a.severidade] += 1;
    return [
      { key: "critica", label: "crítica", count: counts.critica, variant: "destructive" },
      { key: "alta", label: "alta", count: counts.alta, variant: "destructive" },
      { key: "media", label: "média", count: counts.media, variant: "secondary" },
      { key: "baixa", label: "baixa", count: counts.baixa, variant: "outline" },
    ];
  }, [listaBase, searchTerm]);

  // Sugestões: tipos com contagem + recentes + descrições únicas curtas
  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const tiposCount = new Map<Anomalia["tipo_anomalia"], number>();
    const descSet = new Set<string>();
    for (const a of listaBase) {
      tiposCount.set(a.tipo_anomalia, (tiposCount.get(a.tipo_anomalia) ?? 0) + 1);
      if (a.descricao && a.descricao.length <= 80) descSet.add(a.descricao);
    }
    const recent: SearchSuggestion[] = recentSearches.slice(0, 4).map((q) => ({
      label: q,
      value: q,
      group: "Recente",
    }));
    const tipos: SearchSuggestion[] = Array.from(tiposCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tipo, count]) => ({
        label: TIPO_LABEL[tipo] ?? tipo,
        value: TIPO_LABEL[tipo] ?? tipo,
        group: "Tipo",
        count,
      }));
    const descricoes: SearchSuggestion[] = Array.from(descSet)
      .slice(0, 6)
      .map((d) => ({ label: d, value: d, group: "Descrição" }));
    return [...recent, ...tipos, ...descricoes];
  }, [listaBase, recentSearches]);

  const scopeLabel = useMemo(() => {
    const parts: string[] = [];
    if (filters.periodoInicio || filters.periodoFim) {
      parts.push(
        `Período: ${filters.periodoInicio || "—"} → ${filters.periodoFim || "—"}`,
      );
    } else {
      parts.push("Todo o período");
    }
    if (activePresetId) parts.push("Preset ativo");
    if (filters.severidades.length > 0)
      parts.push(`${filters.severidades.length} severidade(s)`);
    if (filters.tipos.length > 0) parts.push(`${filters.tipos.length} tipo(s)`);
    return parts.join(" · ");
  }, [filters, activePresetId]);

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
  const activeFilterCount =
    filters.severidades.length +
    filters.tipos.length +
    (filters.periodoInicio ? 1 : 0) +
    (filters.periodoFim ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

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
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : lista.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              ✓ Nenhuma anomalia neste filtro.
            </p>
          ) : (
            <div className="space-y-2">
              {lista.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-md border bg-card flex items-start justify-between gap-3"
                >
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
