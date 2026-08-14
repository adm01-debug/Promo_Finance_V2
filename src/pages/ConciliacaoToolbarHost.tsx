import { ConciliacaoToolbar } from '@/components/conciliacao/ConciliacaoToolbar';
import type { ConciliacaoFilterState } from '@/components/conciliacao/ConciliacaoFilters';
import type { ConciliacaoSort } from '@/components/conciliacao/conciliacao-toolbar.constants';
import type { SavedFilterPayload } from '@/hooks/useSavedFilters';

export function ConciliacaoToolbarHost({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  sort,
  setSort,
  visibleCols,
  setVisibleCols,
  activePresetId,
  onLoadPreset,
  onClearPreset,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filters: ConciliacaoFilterState;
  setFilters: (f: ConciliacaoFilterState) => void;
  sort: ConciliacaoSort;
  setSort: (s: ConciliacaoSort) => void;
  visibleCols: string[];
  setVisibleCols: (c: string[]) => void;
  activePresetId: string | null;
  onLoadPreset: (p: { id: string; payload: SavedFilterPayload<ConciliacaoFilterState> }) => void;
  onClearPreset: () => void;
}) {
  return (
    <ConciliacaoToolbar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={filters}
      onFiltersChange={setFilters}
      sort={sort}
      onSortChange={setSort}
      visibleCols={visibleCols}
      onVisibleColsChange={setVisibleCols}
      activePresetId={activePresetId}
      onLoadPreset={onLoadPreset}
      onClearPreset={onClearPreset}
    />
  );
}
