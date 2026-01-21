import { useState } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

interface QuickFiltersProps {
  filters: FilterConfig[];
  values: Record<string, string | string[]>;
  onChange: (filterId: string, value: string | string[]) => void;
  onClear?: () => void;
  className?: string;
}

export function QuickFilters({
  filters,
  values,
  onChange,
  onClear,
  className,
}: QuickFiltersProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const hasActiveFilters = Object.values(values).some((v) =>
    Array.isArray(v) ? v.length > 0 : !!v
  );

  const getActiveCount = (filterId: string) => {
    const value = values[filterId];
    if (!value) return 0;
    return Array.isArray(value) ? value.length : 1;
  };

  const handleOptionClick = (filter: FilterConfig, optionValue: string) => {
    if (filter.multiple) {
      const currentValues = (values[filter.id] as string[]) || [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(filter.id, newValues);
    } else {
      const newValue = values[filter.id] === optionValue ? '' : optionValue;
      onChange(filter.id, newValue);
      setOpenFilter(null);
    }
  };

  const isOptionSelected = (filter: FilterConfig, optionValue: string) => {
    const value = values[filter.id];
    if (!value) return false;
    return Array.isArray(value) ? value.includes(optionValue) : value === optionValue;
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <Filter className="w-4 h-4" />
        Filtros:
      </span>

      {filters.map((filter) => (
        <div key={filter.id} className="relative">
          <button
            onClick={() => setOpenFilter(openFilter === filter.id ? null : filter.id)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors',
              getActiveCount(filter.id) > 0
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
            )}
          >
            {filter.label}
            {getActiveCount(filter.id) > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                {getActiveCount(filter.id)}
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                openFilter === filter.id && 'rotate-180'
              )}
            />
          </button>

          {openFilter === filter.id && (
            <div className="absolute z-50 mt-1 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1">
              {filter.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOptionClick(filter, option.value)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors',
                    isOptionSelected(filter, option.value)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span>{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-400">{option.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {hasActiveFilters && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}

// Single filter dropdown
interface SingleFilterProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SingleFilter({
  label,
  options,
  value,
  onChange,
  placeholder = 'Todos',
  className,
}: SingleFilterProps) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.count !== undefined && ` (${option.count})`}
          </option>
        ))}
      </select>
    </div>
  );
}

// Filter chips showing active filters
interface FilterChipsProps {
  filters: FilterConfig[];
  values: Record<string, string | string[]>;
  onRemove: (filterId: string, value: string) => void;
  className?: string;
}

export function FilterChips({
  filters,
  values,
  onRemove,
  className,
}: FilterChipsProps) {
  const chips: { filterId: string; filterLabel: string; value: string; label: string }[] = [];

  filters.forEach((filter) => {
    const filterValue = values[filter.id];
    if (!filterValue) return;

    const filterValues = Array.isArray(filterValue) ? filterValue : [filterValue];
    filterValues.forEach((v) => {
      const option = filter.options.find((o) => o.value === v);
      if (option) {
        chips.push({
          filterId: filter.id,
          filterLabel: filter.label,
          value: v,
          label: option.label,
        });
      }
    });
  });

  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-gray-500 dark:text-gray-400">Filtros ativos:</span>
      {chips.map((chip) => (
        <span
          key={`${chip.filterId}-${chip.value}`}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
        >
          <span className="text-gray-500 dark:text-gray-400">{chip.filterLabel}:</span>
          {chip.label}
          <button
            onClick={() => onRemove(chip.filterId, chip.value)}
            className="ml-1 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export default QuickFilters;
