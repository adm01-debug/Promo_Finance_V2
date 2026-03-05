import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface AdvancedFilters {
  dataVencimentoInicio?: Date;
  dataVencimentoFim?: Date;
  valorMinimo?: number;
  valorMaximo?: number;
  tipoCobranca?: string;
}

interface AdvancedFiltersProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  tiposCobranca?: { value: string; label: string }[];
  className?: string;
}

export function AdvancedFiltersPopover({
  filters,
  onFiltersChange,
  tiposCobranca = [
    { value: 'boleto', label: 'Boleto' },
    { value: 'pix', label: 'PIX' },
    { value: 'cartao', label: 'Cartão' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'dinheiro', label: 'Dinheiro' },
  ],
  className,
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFiltersCount = [
    filters.dataVencimentoInicio,
    filters.dataVencimentoFim,
    filters.valorMinimo,
    filters.valorMaximo,
    filters.tipoCobranca,
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = <K extends keyof AdvancedFilters>(
    key: K,
    value: AdvancedFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className={cn("relative", className)}>
          <CalendarIcon className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-popover border border-border shadow-lg z-50" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filtros Avançados</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={handleClearFilters}
              >
                <RotateCcw className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>

          <Separator />

          {/* Período de Vencimento */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Período de Vencimento</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs",
                      !filters.dataVencimentoInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {filters.dataVencimentoInicio
                      ? format(filters.dataVencimentoInicio, "dd/MM/yy", { locale: ptBR })
                      : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border border-border z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataVencimentoInicio}
                    onSelect={(date) => updateFilter('dataVencimentoInicio', date)}
                    locale={ptBR as unknown as Record<string, unknown>}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-xs",
                      !filters.dataVencimentoFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {filters.dataVencimentoFim
                      ? format(filters.dataVencimentoFim, "dd/MM/yy", { locale: ptBR })
                      : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border border-border z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataVencimentoFim}
                    onSelect={(date) => updateFilter('dataVencimentoFim', date)}
                    locale={ptBR as unknown as Record<string, unknown>}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Faixa de Valor */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Faixa de Valor (R$)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                className="h-9 text-xs"
                value={filters.valorMinimo || ''}
                onChange={(e) => updateFilter('valorMinimo', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Máximo"
                className="h-9 text-xs"
                value={filters.valorMaximo || ''}
                onChange={(e) => updateFilter('valorMaximo', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Tipo de Cobrança */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Tipo de Cobrança</Label>
            <Select
              value={filters.tipoCobranca || 'all'}
              onValueChange={(value) => updateFilter('tipoCobranca', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-[60]">
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposCobranca.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-1">
                {filters.dataVencimentoInicio && (
                  <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                    De: {format(filters.dataVencimentoInicio, "dd/MM", { locale: ptBR })}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer"
                      onClick={() => updateFilter('dataVencimentoInicio', undefined)}
                    />
                  </Badge>
                )}
                {filters.dataVencimentoFim && (
                  <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                    Até: {format(filters.dataVencimentoFim, "dd/MM", { locale: ptBR })}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer"
                      onClick={() => updateFilter('dataVencimentoFim', undefined)}
                    />
                  </Badge>
                )}
                {filters.valorMinimo && (
                  <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                    Min: R${filters.valorMinimo}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer"
                      onClick={() => updateFilter('valorMinimo', undefined)}
                    />
                  </Badge>
                )}
                {filters.valorMaximo && (
                  <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                    Max: R${filters.valorMaximo}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer"
                      onClick={() => updateFilter('valorMaximo', undefined)}
                    />
                  </Badge>
                )}
                {filters.tipoCobranca && (
                  <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                    {tiposCobranca.find(t => t.value === filters.tipoCobranca)?.label}
                    <X
                      className="h-2.5 w-2.5 cursor-pointer"
                      onClick={() => updateFilter('tipoCobranca', undefined)}
                    />
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
