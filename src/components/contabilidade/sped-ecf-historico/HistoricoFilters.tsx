import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';

export type StatusFilter = 'all' | 'liberada' | 'bloqueada' | 'transmitida';
export type ValidacaoFilter = 'all' | 'com_erros' | 'com_avisos' | 'sem_alertas';

interface Props {
  anosDisponiveis: number[];
  searchAno: string;
  setSearchAno: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  validacaoFilter: ValidacaoFilter;
  setValidacaoFilter: (v: ValidacaoFilter) => void;
  filtrosAtivos: number;
  totalFiltrados: number;
  totalHistorico: number;
  onLimpar: () => void;
}

export function HistoricoFilters({
  anosDisponiveis, searchAno, setSearchAno, statusFilter, setStatusFilter,
  validacaoFilter, setValidacaoFilter, filtrosAtivos, totalFiltrados, totalHistorico, onLimpar,
}: Props) {
  return (
    <div
      role="region"
      aria-label="Filtros do histórico ECF"
      className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 bg-muted/30 p-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="ecf-hist-ano" className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          Ano-calendário
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <Input
            id="ecf-hist-ano"
            list="ecf-hist-ano-options"
            value={searchAno}
            onChange={(e) => setSearchAno(e.target.value)}
            placeholder="Ex.: 2024"
            inputMode="numeric"
            className="h-8 w-[140px] pl-8 text-xs"
          />
          <datalist id="ecf-hist-ano-options">
            {anosDisponiveis.map((a) => <option key={a} value={a} />)}
          </datalist>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ecf-hist-status" className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Status</label>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger id="ecf-hist-status" className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="liberada">Liberada</SelectItem>
            <SelectItem value="bloqueada">Bloqueada</SelectItem>
            <SelectItem value="transmitida">Transmitida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ecf-hist-validacao" className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Validações</label>
        <Select value={validacaoFilter} onValueChange={(v) => setValidacaoFilter(v as ValidacaoFilter)}>
          <SelectTrigger id="ecf-hist-validacao" className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="com_erros">Com erros</SelectItem>
            <SelectItem value="com_avisos">Com avisos</SelectItem>
            <SelectItem value="sem_alertas">Sem alertas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="gap-1 text-[10px]" aria-live="polite">
          <Filter className="h-3 w-3" />
          {totalFiltrados} de {totalHistorico}
        </Badge>
        {filtrosAtivos > 0 && (
          <Button size="sm" variant="ghost" onClick={onLimpar} className="h-8 gap-1 text-xs" aria-label={`Limpar ${filtrosAtivos} filtro(s)`}>
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
