import { useState } from 'react';
import { Filter, X, Calendar, DollarSign, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface ConciliacaoFilterState {
  periodoInicio: string;
  periodoFim: string;
  valorMin: string;
  valorMax: string;
  tipo: 'todos' | 'credito' | 'debito';
  confiancaIA: 'todos' | 'alta' | 'media' | 'baixa';
}

const INITIAL_FILTERS: ConciliacaoFilterState = {
  periodoInicio: '',
  periodoFim: '',
  valorMin: '',
  valorMax: '',
  tipo: 'todos',
  confiancaIA: 'todos',
};

interface ConciliacaoFiltersProps {
  filters: ConciliacaoFilterState;
  onFiltersChange: (filters: ConciliacaoFilterState) => void;
}

export function ConciliacaoFilters({ filters, onFiltersChange }: ConciliacaoFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ConciliacaoFilterState>(filters);

  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'tipo' || key === 'confiancaIA') return value !== 'todos';
    return value !== '';
  }).length;

  const handleApply = () => {
    onFiltersChange(draft);
    setOpen(false);
  };

  const handleClear = () => {
    setDraft(INITIAL_FILTERS);
    onFiltersChange(INITIAL_FILTERS);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) setDraft(filters); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Filter className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Período */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Período
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={draft.periodoInicio}
                onChange={(e) => setDraft(d => ({ ...d, periodoInicio: e.target.value }))}
                placeholder="Início"
              />
              <Input
                type="date"
                value={draft.periodoFim}
                onChange={(e) => setDraft(d => ({ ...d, periodoFim: e.target.value }))}
                placeholder="Fim"
              />
            </div>
          </div>

          {/* Faixa de Valor */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Faixa de Valor
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={draft.valorMin}
                onChange={(e) => setDraft(d => ({ ...d, valorMin: e.target.value }))}
                placeholder="Min"
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={draft.valorMax}
                onChange={(e) => setDraft(d => ({ ...d, valorMax: e.target.value }))}
                placeholder="Max"
              />
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Transação</Label>
            <Select
              value={draft.tipo}
              onValueChange={(v) => setDraft(d => ({ ...d, tipo: v as ConciliacaoFilterState['tipo'] }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="credito">Crédito (Entradas)</SelectItem>
                <SelectItem value="debito">Débito (Saídas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Confiança IA */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Brain className="h-4 w-4 text-muted-foreground" />
              Confiança da IA
            </Label>
            <Select
              value={draft.confiancaIA}
              onValueChange={(v) => setDraft(d => ({ ...d, confiancaIA: v as ConciliacaoFilterState['confiancaIA'] }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="alta">Alta (≥80%)</SelectItem>
                <SelectItem value="media">Média (60-79%)</SelectItem>
                <SelectItem value="baixa">Baixa (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="mt-8 flex gap-2">
          <Button variant="outline" onClick={handleClear} className="flex-1 gap-2">
            <X className="h-4 w-4" />
            Limpar
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { INITIAL_FILTERS };
