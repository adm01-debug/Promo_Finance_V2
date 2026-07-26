import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { IndicesFilters } from './types';

interface Props {
  values: IndicesFilters;
  setField: <K extends keyof IndicesFilters>(key: K, value: IndicesFilters[K]) => void;
  countLabel: string;
}

export function IndicesToolbar({ values, setField, countLabel }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-end">
      <div className="space-y-2">
        <Label htmlFor="idx-inicio" className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Data inicial
        </Label>
        <Input
          id="idx-inicio"
          type="date"
          value={values.dataInicio}
          onChange={(e) => setField('dataInicio', e.target.value)}
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idx-fim" className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Data final
        </Label>
        <Input
          id="idx-fim"
          type="date"
          value={values.dataFim}
          onChange={(e) => setField('dataFim', e.target.value)}
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idx-busca" className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Buscar indicador
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" aria-hidden />
          <Input
            id="idx-busca"
            value={values.busca}
            onChange={(e) => setField('busca', e.target.value)}
            placeholder="Liquidez, ROE, ciclo…"
            className="rounded-2xl pl-9"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
        <div className="space-y-0.5">
          <Label htmlFor="idx-comparar" className="text-xs font-bold">
            Comparar período anterior
          </Label>
          <p className="text-[11px] text-muted-foreground">{countLabel}</p>
        </div>
        <Switch
          id="idx-comparar"
          checked={values.compararAnterior}
          onCheckedChange={(v) => setField('compararAnterior', v)}
        />
      </div>
    </div>
  );
}
