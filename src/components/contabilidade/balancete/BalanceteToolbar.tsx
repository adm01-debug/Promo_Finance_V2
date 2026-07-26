import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BalanceteFilters } from './types';

interface Props {
  values: BalanceteFilters;
  setField: <K extends keyof BalanceteFilters>(key: K, value: BalanceteFilters[K]) => void;
  countLabel: string;
}

const NIVEIS = ['todos', '1', '2', '3', '4', '5'] as const;

export function BalanceteToolbar({ values, setField, countLabel }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 items-end">
      <div className="space-y-2">
        <Label htmlFor="bal-inicio" className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Data inicial
        </Label>
        <Input
          id="bal-inicio"
          type="date"
          value={values.dataInicio}
          onChange={(e) => setField('dataInicio', e.target.value)}
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bal-fim" className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Data final
        </Label>
        <Input
          id="bal-fim"
          type="date"
          value={values.dataFim}
          onChange={(e) => setField('dataFim', e.target.value)}
          className="rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bal-nivel" className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Nível máximo
        </Label>
        <Select value={values.nivelMax} onValueChange={(v) => setField('nivelMax', v)}>
          <SelectTrigger id="bal-nivel" className="rounded-2xl">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            {NIVEIS.map((n) => (
              <SelectItem key={n} value={n}>
                {n === 'todos' ? 'Todos os níveis' : `Até nível ${n}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bal-busca" className="text-[10px] font-black uppercase tracking-widest opacity-60">
          Buscar conta
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="bal-busca"
            value={values.busca}
            placeholder="Código ou nome"
            onChange={(e) => setField('busca', e.target.value)}
            className="pl-9 rounded-2xl"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/40 bg-card/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <Switch
            id="bal-mov"
            checked={values.apenasComMovimento}
            onCheckedChange={(v) => setField('apenasComMovimento', v)}
          />
          <Label htmlFor="bal-mov" className="text-xs font-semibold">Só com movimento</Label>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{countLabel}</span>
      </div>
    </div>
  );
}
