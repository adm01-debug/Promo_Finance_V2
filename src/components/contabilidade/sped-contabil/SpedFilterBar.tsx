import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StatusFilter, ValidacaoFilter } from './types';

interface Props {
  searchAno: string;
  onSearchAnoChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  validacaoFilter: ValidacaoFilter;
  onValidacaoFilterChange: (v: ValidacaoFilter) => void;
  onClear: () => void;
}

export function SpedFilterBar({
  searchAno,
  onSearchAnoChange,
  statusFilter,
  onStatusFilterChange,
  validacaoFilter,
  onValidacaoFilterChange,
  onClear,
}: Props) {
  const hasFilters = !!searchAno || statusFilter !== 'all' || validacaoFilter !== 'all';
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-card/5 p-4 mb-2">
      <div className="space-y-1.5 flex-1 min-w-[140px]">
        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Buscar Ano</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchAno}
            onChange={(e) => onSearchAnoChange(e.target.value)}
            placeholder="Ex.: 2024"
            className="h-10 pl-9 bg-black/20 border-white/5 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5 flex-1 min-w-[160px]">
        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Status</Label>
        <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
          <SelectTrigger className="h-10 bg-black/20 border-white/5 rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="liberada">Liberada</SelectItem>
            <SelectItem value="bloqueada">Bloqueada</SelectItem>
            <SelectItem value="transmitida">Transmitida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 flex-1 min-w-[180px]">
        <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Validações</Label>
        <Select value={validacaoFilter} onValueChange={(v) => onValidacaoFilterChange(v as ValidacaoFilter)}>
          <SelectTrigger className="h-10 bg-black/20 border-white/5 rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="com_erros">Com erros</SelectItem>
            <SelectItem value="com_avisos">Com avisos</SelectItem>
            <SelectItem value="sem_alertas">Sem alertas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-10 rounded-xl px-4 gap-2 text-xs font-bold hover:bg-card/10"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
