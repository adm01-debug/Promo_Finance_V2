import { ArrowUpDown, Filter, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/shared/ColumnVisibilityMenu";
import type { SavedFilterPayload } from "@/hooks/useSavedFilters";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";
import {
  COLUNAS,
  ENTITY_TYPE,
  SEVERIDADES,
  SORT_OPTIONS,
  TIPOS,
  TIPO_LABEL,
  type AnomaliaFilters,
} from "./AnomaliasDetectadasPanel.helpers";

export interface AnomaliasFiltersBarProps {
  filters: AnomaliaFilters;
  setFilters: React.Dispatch<React.SetStateAction<AnomaliaFilters>>;
  sort: { key: string; dir: "asc" | "desc" };
  setSort: React.Dispatch<React.SetStateAction<{ key: string; dir: "asc" | "desc" }>>;
  visibleCols: string[];
  setVisibleCols: (cols: string[]) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  activePresetId: string | null;
  setActivePresetId: (id: string | null) => void;
  currentState: SavedFilterPayload<AnomaliaFilters>;
  listaLength: number;
  listaBaseLength: number;
  severityPreview: SeverityPreview[];
  searchSuggestions: SearchSuggestion[];
  scopeLabel: string;
  activeFilterCount: number;
  reabertasIndex: unknown;
  exportRows: Anomalia[];
  exportColumns: ViewExportColumn<Anomalia>[];
  exportMeta: {
    filtros?: Record<string, string | undefined | null>;
    ordenacao?: string;
    periodo?: string;
  };
  onClearPreset: () => void;
}

export function AnomaliasFiltersBar({
  filters,
  setFilters,
  sort,
  setSort,
  visibleCols,
  setVisibleCols,
  searchTerm,
  setSearchTerm,
  activePresetId,
  setActivePresetId,
  currentState,
  listaLength,
  listaBaseLength,
  severityPreview,
  searchSuggestions,
  scopeLabel,
  activeFilterCount,
  reabertasIndex,
  exportRows,
  exportColumns,
  exportMeta,
  onLoadPreset,
  onClearPreset,
}: AnomaliasFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SavedFiltersBar
        entityType={ENTITY_TYPE}
        currentState={currentState}
        activePresetId={activePresetId}
        onLoad={onLoadPreset}
        onClear={onClearPreset}
        onRestoreState={({ presetId, payload }) => {
          setFilters((f) => ({ ...f, ...payload.filters }));
          if (payload.sort) setSort(payload.sort);
          if (payload.columns)
            setVisibleCols(mergeLockedColumns(payload.columns, COLUNAS));
          setActivePresetId(presetId);
        }}
      />

      <AdvancedSearchPopover
        value={searchTerm}
        onApply={setSearchTerm}
        totalPreview={listaLength}
        severityPreview={severityPreview}
        suggestions={searchSuggestions}
        scopeLabel={scopeLabel}
        placeholder="Buscar em descrição, tipo, observações…"
      />

      <Select
        value={filters.status}
        onValueChange={(v) =>
          setFilters((f) => ({ ...f, status: v as AnomaliaFilters["status"] }))
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
          <DropdownMenuLabel className="text-xs">Severidades</DropdownMenuLabel>
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
                  tipos: v ? [...f.tipos, t] : f.tipos.filter((x) => x !== t),
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
            {listaBaseLength}
          </Badge>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Ordenar: {SORT_OPTIONS.find((o) => o.key === sort.key)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs">Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_OPTIONS.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.key}
              checked={sort.key === o.key}
              onCheckedChange={() => setSort((s) => ({ key: o.key, dir: s.dir }))}
              onSelect={(e) => e.preventDefault()}
            >
              {o.label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={sort.dir === "desc"}
            onCheckedChange={() =>
              setSort((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))
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
        rows={exportRows}
        columns={exportColumns}
        meta={exportMeta}
      />

      {activeFilterCount > 0 && (
        <Badge variant="outline" className="h-7 px-2">
          {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} ativo
          {activeFilterCount > 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );
}
