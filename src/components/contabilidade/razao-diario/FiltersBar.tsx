import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { cn } from '@/lib/utils';
import type { ManagedFiltersController } from '@/hooks/useManagedFilters';
import type { DatePreset, RazaoFilters } from './types';

interface Props {
  ano: number;
  busca: string;
  setBusca: (v: string) => void;
  preset: DatePreset;
  handlePreset: (p: DatePreset) => void;
  dataInicio: string;
  dataFim: string;
  setDataInicio: (v: string) => void;
  setDataFim: (v: string) => void;
  setPreset: (p: DatePreset) => void;
  contaId: string;
  setContaId: (v: string) => void;
  plano: Array<{ id: string; codigo: string; nome?: string; descricao?: string; tipo: string }>;
  filtersController: {
    values: RazaoFilters;
    reset: () => void;
    setValues: (v: RazaoFilters) => void;
    isHydrated: boolean;
    setField: <K extends keyof RazaoFilters>(k: K, v: RazaoFilters[K]) => void;
  };
  countLabel: string;
}

const toIsoDate = (d: Date) => format(d, 'yyyy-MM-dd');

export function FiltersBar({
  ano, busca, setBusca, preset, handlePreset, dataInicio, dataFim,
  setDataInicio, setDataFim, setPreset, contaId, setContaId, plano,
  filtersController, countLabel,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[320px] group/search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
        <Input
          placeholder="Buscar por histórico ou conta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-14 pl-12 bg-card/5 border-white/5 rounded-2xl font-bold text-lg transition-all focus:ring-primary/20 placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="flex items-center gap-3">
        <Select value={preset} onValueChange={(v) => handlePreset(v as DatePreset)}>
          <SelectTrigger className="h-12 w-[180px] rounded-2xl border-white/5 bg-card/5 font-bold"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
            <SelectItem value="ano">Ano de {ano}</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="last7">Últimos 7 dias</SelectItem>
            <SelectItem value="last30">Últimos 30 dias</SelectItem>
            <SelectItem value="mes">Este mês</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('h-12 rounded-2xl border-white/5 bg-card/5 gap-2 px-5 font-bold', !dataInicio && 'text-muted-foreground')}>
              <CalendarIcon className="h-4 w-4 text-primary" />
              {dataInicio ? format(new Date(`${dataInicio}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden" align="start">
            <Calendar mode="single" selected={dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined}
              onSelect={(d) => { if (d) { setDataInicio(toIsoDate(d)); setPreset('custom'); } }}
              initialFocus className={cn('p-3 pointer-events-auto')} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('h-12 rounded-2xl border-white/5 bg-card/5 gap-2 px-5 font-bold', !dataFim && 'text-muted-foreground')}>
              <CalendarIcon className="h-4 w-4 text-primary" />
              {dataFim ? format(new Date(`${dataFim}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden" align="start">
            <Calendar mode="single" selected={dataFim ? new Date(`${dataFim}T00:00:00`) : undefined}
              onSelect={(d) => { if (d) { setDataFim(toIsoDate(d)); setPreset('custom'); } }}
              initialFocus className={cn('p-3 pointer-events-auto')} />
          </PopoverContent>
        </Popover>
      </div>

      <Select value={contaId} onValueChange={setContaId}>
        <SelectTrigger className="h-12 w-[220px] rounded-2xl border-white/5 bg-card/5 font-bold">
          <SelectValue placeholder="Todas as contas" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
          <SelectItem value="todas">Todas as contas</SelectItem>
          {plano.filter((c) => c.tipo === 'analitica').map((c) => (
            <SelectItem key={c.id} value={c.id} className="font-mono text-xs">{c.codigo} — {c.nome || c.descricao}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ClearFiltersButton
        controller={filtersController}
        entityLabel="razão & diário"
        describeFilters={(v) => [
          { label: 'Busca', value: v.busca, isActive: !!v.busca },
          { label: 'Conta', value: v.contaId, isActive: v.contaId !== 'todas' },
          { label: 'Período', value: v.preset, isActive: v.preset !== 'ano' },
        ]}
      />

      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 bg-card/5 px-5 py-4 rounded-2xl border border-white/5 ml-auto">
        {countLabel}
      </div>
    </div>
  );
}
