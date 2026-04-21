import { useEffect, useMemo, useState } from "react";
import { AnomaliaPreferencesDialog } from "./AnomaliaPreferencesDialog";
import { BellOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useAnomaliasDetectadas,
  usePendingAnomaliasQueue,
  type Anomalia,
} from "@/hooks/useAnomaliasDetectadas";
import { AnomaliasReviewQueue } from "./AnomaliasReviewQueue";
import { AnomaliaDrillDownDrawer } from "./AnomaliaDrillDownDrawer";
import { dispatchOpenAnomaliaDrawer } from "@/lib/anomalia-routes";
import { SavedFiltersBar } from "@/components/shared/SavedFiltersBar";
import {
  ColumnVisibilityMenu,
  type ColumnDef,
} from "@/components/shared/ColumnVisibilityMenu";
import type { SavedFilterPayload } from "@/hooks/useSavedFilters";
import { useSavedFilters } from "@/hooks/useSavedFilters";

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

export function AnomaliasDetectadasPanel() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [filters, setFilters] = useState<AnomaliaFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "detectada_em",
    dir: "desc",
  });
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const { defaultFilter } = useSavedFilters<AnomaliaFilters>(ENTITY_TYPE);

  // Bootstrap: aplica preset padrão do usuário no primeiro load
  useEffect(() => {
    if (bootstrapped) return;
    if (defaultFilter) {
      setFilters({ ...DEFAULT_FILTERS, ...defaultFilter.filters.filters });
      if (defaultFilter.filters.sort) setSort(defaultFilter.filters.sort);
      if (defaultFilter.filters.columns)
        setVisibleCols(defaultFilter.filters.columns);
      setActivePresetId(defaultFilter.id);
    }
    setBootstrapped(true);
  }, [defaultFilter, bootstrapped]);

  const { data, isLoading, atualizarStatus, detectar } = useAnomaliasDetectadas(
    filters.status === "todas" ? undefined : filters.status,
  );
  const { data: pendentes = [] } = usePendingAnomaliasQueue();

  const lista = useMemo(() => {
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
  }, [data, filters, sort]);

  const currentState: SavedFilterPayload<AnomaliaFilters> = useMemo(
    () => ({ v: 1, filters, sort, columns: visibleCols }),
    [filters, sort, visibleCols],
  );

  const handleLoadPreset = (preset: {
    id: string;
    payload: SavedFilterPayload<AnomaliaFilters>;
  }) => {
    setFilters({ ...DEFAULT_FILTERS, ...preset.payload.filters });
    if (preset.payload.sort) setSort(preset.payload.sort);
    if (preset.payload.columns) setVisibleCols(preset.payload.columns);
    setActivePresetId(preset.id);
  };

  const handleClearPreset = () => {
    setActivePresetId(null);
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_PAYLOAD.sort!);
    setVisibleCols(DEFAULT_VISIBLE);
  };

  const isVisible = (k: string) => visibleCols.includes(k);
  const activeFilterCount =
    filters.severidades.length +
    filters.tipos.length +
    (filters.periodoInicio ? 1 : 0) +
    (filters.periodoFim ? 1 : 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Anomalias detectadas
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
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
                onClick={() => detectar.mutate()}
                disabled={detectar.isPending}
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${detectar.isPending ? "animate-spin" : ""}`}
                />
                Detectar agora
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SavedFiltersBar
              entityType={ENTITY_TYPE}
              currentState={currentState}
              activePresetId={activePresetId}
              onLoad={handleLoadPreset}
              onClear={handleClearPreset}
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
                        onClick={() =>
                          atualizarStatus.mutate({
                            id: a.id,
                            status: "investigando",
                          })
                        }
                        disabled={atualizarStatus.isPending}
                      >
                        <Search className="h-3 w-3 mr-1" /> Investigar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          atualizarStatus.mutate({
                            id: a.id,
                            status: "falso_positivo",
                          })
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
                          atualizarStatus.mutate({
                            id: a.id,
                            status: "confirmada",
                          })
                        }
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                      </Button>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AnomaliasReviewQueue open={reviewOpen} onOpenChange={setReviewOpen} />
      <AnomaliaDrillDownDrawer />
    </div>
  );
}
