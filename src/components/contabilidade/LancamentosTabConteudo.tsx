import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, CalendarIcon, Activity, Clock, Zap, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterPresetsManager } from './FilterPresetsManager';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { LancamentosFilters, DatePreset } from './LancamentosTab.types';

interface LancamentosTabConteudoProps {
  empresaId: string;
  filtersController: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useManagedFilters').ManagedFiltersController<LancamentosFilters>;
  busca: string;
  setBusca: (v: string) => void;
  preset: DatePreset;
  handlePreset: (p: DatePreset) => void;
  ano: number;
  dataInicio: Date;
  setDataInicio: (d: Date | undefined) => void;
  dataFim: Date;
  setDataFim: (d: Date | undefined) => void;
  lancsFiltrados: {
    id: string;
    numero_lancamento: number;
    data_lancamento: string;
    historico: string;
    origem: string;
    valor_total: number;
    status: string;
  }[];
  lancs: {
    competencia: string | null;
    created_at: string;
    created_by: string | null;
    data_lancamento: string;
    empresa_id: string | null;
    historico: string | null;
    id: string;
    numero_lancamento: number | null;
    origem: string | null;
    status: string;
    updated_at: string;
    user_id: string;
    valor_total: number;
    partidas: {
      conta_id: string | null;
      created_at: string | null;
      historico_complementar: string | null;
      id: string;
      lancamento_id: string | null;
      ordem: number | null;
      tipo: string;
      valor: number;
      conta: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@supabase/postgrest-js/dist/cjs/select-query-parser/utils').SelectQueryError<'could not find the relation between partidas_contabeis and plano_contas'>;
    }[];
  }[];
  isLoading: boolean;
}

export function LancamentosTabConteudo({
  empresaId,
  filtersController,
  busca,
  setBusca,
  preset,
  handlePreset,
  ano,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  lancsFiltrados,
  lancs,
  isLoading,
}: LancamentosTabConteudoProps) {
  return (
    <CardContent className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <FilterPresetsManager
          entityType="lancamentos-contabeis"
          empresaId={empresaId}
          currentFilters={filtersController.values}
          onLoadPreset={(f) => filtersController.setValues(f)}
        />
        <div className="relative flex-1 min-w-[320px] group/search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
          <Input
            placeholder="Buscar por histórico ou nº do lançamento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-14 pl-12 bg-card/5 border-white/5 rounded-2xl font-bold text-lg transition-all focus:ring-primary/20 placeholder:text-muted-foreground/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={preset} onValueChange={(v) => handlePreset(v as DatePreset)}>
            <SelectTrigger className="h-12 w-[180px] rounded-2xl border-white/5 bg-card/5 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="last7">Últimos 7 dias</SelectItem>
              <SelectItem value="last30">Últimos 30 dias</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="ano">Ano de {ano}</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-12 rounded-2xl border-white/5 bg-card/5 gap-2 px-5 font-bold',
                  !dataInicio && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="h-4 w-4 text-primary" />
                {dataInicio ? format(dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Início'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden"
              align="start"
            >
              <Calendar
                mode="single"
                selected={dataInicio}
                onSelect={(d) => {
                  setDataInicio(d);
                  filtersController.setField('preset', 'custom');
                }}
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-12 rounded-2xl border-white/5 bg-card/5 gap-2 px-5 font-bold',
                  !dataFim && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="h-4 w-4 text-primary" />
                {dataFim ? format(dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden"
              align="start"
            >
              <Calendar
                mode="single"
                selected={dataFim}
                onSelect={(d) => {
                  setDataFim(d);
                  filtersController.setField('preset', 'custom');
                }}
                initialFocus
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>
        </div>

        <ClearFiltersButton
          controller={filtersController}
          entityLabel="lançamentos contábeis"
          describeFilters={(v) => [
            { label: 'Busca', value: v.busca, isActive: !!v.busca },
            { label: 'Período', value: v.preset, isActive: v.preset !== 'all' },
            { label: 'Data início', value: v.dataInicio, isActive: !!v.dataInicio },
            { label: 'Data fim', value: v.dataFim, isActive: !!v.dataFim },
          ]}
        />

        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 bg-card/5 px-5 py-4 rounded-2xl border border-white/5 ml-auto">
          {lancsFiltrados.length} / {lancs.length} registros
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
          <Activity className="h-8 w-8 animate-spin mr-3 opacity-20" />
          <span className="font-black uppercase tracking-widest text-xs">
            Acessando razão contábil...
          </span>
        </div>
      ) : lancsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-[2.5rem] bg-card/[0.02]">
          <Search className="h-10 w-10 opacity-20 mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest">
            Nenhum lançamento encontrado
          </p>
          <p className="text-[10px] opacity-50 mt-1 uppercase tracking-widest">
            Ajuste os filtros para ampliar a busca
          </p>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-card/[0.01] shadow-inner">
          <Table>
            <TableHeader className="bg-card/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-24 text-[10px] font-black uppercase tracking-widest p-6">
                  Nº Lanc.
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">
                  Data
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">
                  Histórico Analítico
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">
                  Fonte
                </TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
                  Montante
                </TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {lancsFiltrados.slice(0, 100).map((l, idx) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.005 }}
                    className="border-white/5 hover:bg-card/5 transition-colors group/row"
                  >
                    <TableCell className="p-6">
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px] font-black border-none bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg"
                      >
                        #{String(l.numero_lancamento).padStart(4, '0')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {format(new Date(l.data_lancamento + 'T00:00:00'), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground/80 truncate">
                          {l.historico}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="h-3 w-3 opacity-40 text-primary" />
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">
                            Integridade Validada
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="capitalize border-none bg-card/5 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 w-fit"
                      >
                        <Zap className="h-3 w-3 text-primary opacity-60" />
                        {l.origem}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-black text-sm tabular-nums text-foreground/90">
                      {formatCurrency(l.valor_total)}
                    </TableCell>
                    <TableCell className="pr-8">
                      <div className="flex items-center justify-end gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'uppercase text-[9px] font-black tracking-widest border-none px-3 py-1 rounded-full',
                            l.status === 'confirmado'
                              ? 'bg-success/20 text-success'
                              : 'bg-warning/20 text-warning'
                          )}
                        >
                          {l.status}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg opacity-0 group-hover/row:opacity-100 transition-opacity"
                              >
                                <Eye className="h-4 w-4 opacity-40 hover:opacity-100" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                              <p className="text-[10px] font-black uppercase tracking-widest">
                                Ver Detalhes das Partidas
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      )}
      {lancsFiltrados.length > 100 && (
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center mt-6">
          Exibindo 100 de {lancsFiltrados.length.toLocaleString('pt-BR')} lançamentos. Refine o
          período para auditoria completa.
        </p>
      )}
    </CardContent>
  );
}
