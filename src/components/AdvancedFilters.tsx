/**
 * Componente de Filtros Avançados
 * 
 * @module components/AdvancedFilters
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'dateRange';
  options?: { value: string; label: string }[];
}

export interface FilterValue {
  key: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike';
  value: unknown;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  values: FilterValue[];
  onChange: (values: FilterValue[]) => void;
  className?: string;
}

export function AdvancedFilters({ filters, values, onChange, className }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleFilterChange = (key: string, value: unknown) => {
    const newValues = values.filter(v => v.key !== key);
    if (value !== undefined && value !== '' && value !== null) {
      newValues.push({ key, operator: 'eq', value });
    }
    onChange(newValues);
  };

  const handleClear = () => {
    onChange([]);
  };

  const activeCount = values.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filtros Avançados</h4>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 text-xs gap-1">
                <RotateCcw className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>

          {filters.map((filter) => {
            const currentValue = values.find(v => v.key === filter.key)?.value;
            
            return (
              <div key={filter.key} className="space-y-2">
                <Label className="text-xs">{filter.label}</Label>
                {filter.type === 'select' && filter.options ? (
                  <Select
                    value={(currentValue as string) || ''}
                    onValueChange={(v) => handleFilterChange(filter.key, v || undefined)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={`Selecione ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {filter.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={filter.type === 'number' ? 'number' : filter.type === 'date' ? 'date' : 'text'}
                    value={(currentValue as string) || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value || undefined)}
                    className="h-9"
                    placeholder={`Filtrar por ${filter.label}`}
                  />
                )}
              </div>
            );
          })}

          {activeCount > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t">
              {values.map((v) => {
                const filterConfig = filters.find(f => f.key === v.key);
                const label = filterConfig?.label || v.key;
                return (
                  <Badge key={v.key} variant="secondary" className="gap-1 text-xs">
                    {label}: {String(v.value)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleFilterChange(v.key, undefined)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AdvancedFilters;
