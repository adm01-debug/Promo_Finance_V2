import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Search, ArrowUpDown } from "lucide-react";
import {
  ConciliacaoFilters,
  type ConciliacaoFilterState,
} from "./ConciliacaoFilters";
import { SavedFiltersBar } from "@/components/shared/SavedFiltersBar";
import {
  ColumnVisibilityMenu,
  type ColumnDef,
} from "@/components/shared/ColumnVisibilityMenu";
import type { SavedFilterPayload } from "@/hooks/useSavedFilters";

export interface ConciliacaoSort {
  key: "data" | "valor" | "descricao" | "tipo";
  dir: "asc" | "desc";
}

export const CONCILIACAO_COLUMNS: ColumnDef[] = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição", locked: true },
  { key: "valor", label: "Valor", locked: true },
  { key: "tipo", label: "Tipo (ícone)" },
  { key: "acoes", label: "Ações", locked: true },
];

const SORT_OPTIONS: { key: ConciliacaoSort["key"]; label: string }[] = [
  { key: "data", label: "Data" },
  { key: "valor", label: "Valor" },
  { key: "descricao", label: "Descrição" },
  { key: "tipo", label: "Tipo" },
];

export const CONCILIACAO_DEFAULT_VISIBLE = CONCILIACAO_COLUMNS.map((c) => c.key);
export const CONCILIACAO_DEFAULT_SORT: ConciliacaoSort = {
  key: "data",
  dir: "desc",
};

interface ConciliacaoToolbarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filters: ConciliacaoFilterState;
  onFiltersChange: (f: ConciliacaoFilterState) => void;
  sort: ConciliacaoSort;
  onSortChange: (s: ConciliacaoSort) => void;
  visibleCols: string[];
  onVisibleColsChange: (cols: string[]) => void;
  activePresetId: string | null;
  onLoadPreset: (preset: {
    id: string;
    payload: SavedFilterPayload<ConciliacaoFilterState>;
  }) => void;
  onClearPreset: () => void;
}

export function ConciliacaoToolbar({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  visibleCols,
  onVisibleColsChange,
  activePresetId,
  onLoadPreset,
  onClearPreset,
}: ConciliacaoToolbarProps) {
  const currentState: SavedFilterPayload<ConciliacaoFilterState> = useMemo(
    () => ({ v: 1, filters, sort, columns: visibleCols }),
    [filters, sort, visibleCols],
  );

  return (
    <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
      <div className="relative flex-1 lg:w-[260px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar transações..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <SavedFiltersBar<ConciliacaoFilterState>
        entityType="conciliacao_transacoes"
        currentState={currentState}
        activePresetId={activePresetId}
        onLoad={onLoadPreset}
        onClear={onClearPreset}
      />

      <ConciliacaoFilters filters={filters} onFiltersChange={onFiltersChange} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {SORT_OPTIONS.find((o) => o.key === sort.key)?.label}
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {sort.dir === "asc" ? "↑" : "↓"}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs">Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_OPTIONS.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.key}
              checked={sort.key === o.key}
              onCheckedChange={() => onSortChange({ ...sort, key: o.key })}
              onSelect={(e) => e.preventDefault()}
            >
              {o.label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={sort.dir === "desc"}
            onCheckedChange={() =>
              onSortChange({
                ...sort,
                dir: sort.dir === "asc" ? "desc" : "asc",
              })
            }
            onSelect={(e) => e.preventDefault()}
          >
            Descendente
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ColumnVisibilityMenu
        columns={CONCILIACAO_COLUMNS}
        visible={visibleCols}
        onChange={onVisibleColsChange}
      />
    </div>
  );
}
