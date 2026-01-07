import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Check, X, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        'flex items-center gap-1.5 group hover:text-foreground transition-colors',
        isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
        className
      )}
    >
      <span>{label}</span>
      <motion.div
        animate={{ scale: isActive ? 1 : 0.8, opacity: isActive ? 1 : 0.5 }}
        className="transition-transform"
      >
        {direction === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : direction === 'desc' ? (
          <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-0 group-hover:opacity-50" />
        )}
      </motion.div>
    </button>
  );
}

// Hook para gerenciar ordenação
export function useSort<T>(
  data: T[],
  defaultSort?: SortConfig
) {
  const [sort, setSort] = useState<SortConfig>(
    defaultSort || { key: '', direction: null }
  );

  const handleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const sortedData = [...data].sort((a, b) => {
    if (!sort.key || !sort.direction) return 0;

    const aValue = (a as Record<string, unknown>)[sort.key];
    const bValue = (b as Record<string, unknown>)[sort.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue, 'pt-BR', { sensitivity: 'base' });
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime();
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sort.direction === 'desc' ? -comparison : comparison;
  });

  return { sort, handleSort, sortedData };
}

// Componente de filtro com dropdown
interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  multiSelect?: boolean;
  searchable?: boolean;
  className?: string;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  multiSelect = false,
  searchable = false,
  className,
}: FilterDropdownProps) {
  const [search, setSearch] = useState('');
  const hasSelection = value.length > 0;

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    if (multiSelect) {
      onChange(
        value.includes(optionValue)
          ? value.filter((v) => v !== optionValue)
          : [...value, optionValue]
      );
    } else {
      onChange(value.includes(optionValue) ? [] : [optionValue]);
    }
  };

  const getLabel = () => {
    if (value.length === 0) return label;
    if (value.length === 1) {
      return options.find((o) => o.value === value[0])?.label || label;
    }
    return `${value.length} selecionados`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 h-9',
            hasSelection && 'border-primary/50 bg-primary/5',
            className
          )}
        >
          <Filter className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{getLabel()}</span>
          {hasSelection && (
            <Badge
              variant="secondary"
              className="h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {value.length}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {searchable && (
          <>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <div className="max-h-[200px] overflow-auto">
          {filteredOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span>{option.label}</span>
              <div className="flex items-center gap-2">
                {option.count !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    ({option.count})
                  </span>
                )}
                {value.includes(option.value) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          {filteredOptions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum resultado
            </div>
          )}
        </div>
        {hasSelection && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onChange([])}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar seleção
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Active Filters Display
interface ActiveFiltersProps {
  filters: { key: string; label: string; value: string }[];
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-sm text-muted-foreground">Filtros:</span>
      <AnimatePresence mode="popLayout">
        {filters.map((filter) => (
          <motion.div
            key={`${filter.key}-${filter.value}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive/10 transition-colors"
              onClick={() => onRemove(filter.key, filter.value)}
            >
              <span className="text-muted-foreground text-xs">{filter.label}:</span>
              <span>{filter.value}</span>
              <X className="h-3 w-3 ml-1" />
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-muted-foreground hover:text-destructive"
        onClick={onClearAll}
      >
        Limpar tudo
      </Button>
    </motion.div>
  );
}
