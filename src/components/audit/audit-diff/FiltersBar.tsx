import { Filter, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  query: string;
  setQuery: (v: string) => void;
  activeFields: Set<string>;
  onToggleField: (key: string) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
  totalFiltered: number;
}

export function FiltersBar({
  query,
  setQuery,
  activeFields,
  onToggleField,
  onClearFilters,
  hasFilters,
  totalFiltered,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por campo ou valor..."
          className="pl-7 h-8 text-xs"
          aria-label="Buscar alterações por campo ou valor"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => setQuery('')}
            aria-label="Limpar busca"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
      </div>
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          {Array.from(activeFields).map((k) => (
            <Badge key={k} variant="secondary" className="text-[10px] gap-1 pr-1">
              {k}
              <button
                type="button"
                onClick={() => onToggleField(k)}
                className="rounded-sm hover:bg-background/40 p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={`Remover filtro: ${k}`}
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={onClearFilters}
            aria-label="Limpar todos os filtros"
          >
            Limpar
          </Button>
          <span className="text-[11px] text-muted-foreground ml-auto">
            {totalFiltered} resultado(s)
          </span>
        </div>
      )}
    </div>
  );
}
