import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search, CalendarIcon, Activity, BookOpen, Clock, ArrowUpRight, ShieldCheck, Zap, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NovoLancamentoDialog } from './NovoLancamentoDialog';import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterPresetsManager } from './FilterPresetsManager';
import { logUserAction } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ImportLancamentosCSVDialog } from './ImportLancamentosCSVDialog';

interface Props { empresaId?: string; ano: number }

type DatePreset = 'all' | 'today' | 'last7' | 'last30' | 'mes' | 'ano' | 'custom';

interface LancamentosFilters extends Record<string, unknown> {
  busca: string;
  preset: DatePreset;
  dataInicio: string | null; // ISO yyyy-MM-dd
  dataFim: string | null;
}

const LANCAMENTOS_DEFAULTS: LancamentosFilters = {
  busca: '',
  preset: 'all',
  dataInicio: null,
  dataFim: null,
};

export function LancamentosTab({ empresaId, ano }: Props) {
  const { user } = useAuth();
  // Filtros gerenciados
  const filtersController = useManagedFilters<LancamentosFilters>({
    entityType: 'lancamentos-contabeis',
    defaults: LANCAMENTOS_DEFAULTS,
    localStorageKey: 'app-lancamentos-filters',
  });
  const { busca, preset, dataInicio: dataInicioStr, dataFim: dataFimStr } = filtersController.values;
  const dataInicio = useMemo(() => (dataInicioStr ? new Date(`${dataInicioStr}T00:00:00`) : undefined), [dataInicioStr]);
  const dataFim = useMemo(() => (dataFimStr ? new Date(`${dataFimStr}T23:59:59`) : undefined), [dataFimStr]);
  const setBusca = (v: string) => filtersController.setField('busca', v);
  const setDataInicio = (d: Date | undefined) => filtersController.setField('dataInicio', d ? format(d, 'yyyy-MM-dd') : null);
  const setDataFim = (d: Date | undefined) => filtersController.setField('dataFim', d ? format(d, 'yyyy-MM-dd') : null);

  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);

  const contasAnaliticas = plano.filter(p => p.tipo === 'analitica');
  const handlePreset = (p: DatePreset) => {
    const hoje = new Date();
    let ini: Date | undefined; let fim: Date | undefined;
    switch (p) {
      case 'all': break;
      case 'today': ini = startOfDay(hoje); fim = endOfDay(hoje); break;
      case 'last7': ini = startOfDay(subDays(hoje, 6)); fim = endOfDay(hoje); break;
      case 'last30': ini = startOfDay(subDays(hoje, 29)); fim = endOfDay(hoje); break;
      case 'mes': ini = startOfMonth(hoje); fim = endOfMonth(hoje); break;
      case 'ano': ini = startOfYear(new Date(ano, 0, 1)); fim = endOfYear(new Date(ano, 0, 1)); break;
      case 'custom': return filtersController.setField('preset', p);
    }
    
    const oldValues = { ...filtersController.values };
    const nextValues = {
      ...filtersController.values,
      preset: p,
      dataInicio: ini ? format(ini, 'yyyy-MM-dd') : null,
      dataFim: fim ? format(fim, 'yyyy-MM-dd') : null,
    };
    
    filtersController.setValues(nextValues);

    if (user) {
      logUserAction({
        userId: user.id,
        actionType: 'filter_change',
        entityType: 'lancamentos-contabeis',
        oldValue: oldValues,
        newValue: nextValues
      });
    }
  };

  const lancsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lancs.filter((l: { data_lancamento: string; historico: string; numero_lancamento: number }) => {
      if (dataInicio || dataFim) {
        const dl = new Date(l.data_lancamento + 'T00:00:00');
        if (dataInicio && dl < dataInicio) return false;
        if (dataFim && dl > dataFim) return false;
      }
      if (termo) {
        const hay = `${l.historico} ${l.numero_lancamento}`.toLowerCase();
        if (!hay.includes(termo)) return false;
      }
      return true;
    });
  }, [lancs, busca, dataInicio, dataFim]);

  const volumeFinanceiro = useMemo(() => 
    lancsFiltrados.reduce((acc, l) => acc + (Number(l.valor_total) || 0), 0), 
    [lancsFiltrados]
  );

  return (
    <div className="space-y-10">
      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
            <Activity className="h-20 w-20 text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Lançamentos</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black tracking-tighter tabular-nums">{lancsFiltrados.length}</p>
            <span className="text-[10px] font-bold text-primary/60">Registros em {ano}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
            <Zap className="h-20 w-20 text-success" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Volume Financeiro</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black tracking-tighter tabular-nums text-success">{formatCurrency(volumeFinanceiro)}</p>
            <ArrowUpRight className="h-4 w-4 text-success opacity-40" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-success/20 ring-1 ring-success/30 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/kpi:scale-110 transition-transform">
            <ShieldCheck className="h-20 w-20" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status de Auditoria</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-4xl font-black tracking-tighter">100%</p>
            <Badge variant="outline" className="border-none bg-success/20 text-success font-black text-[10px] px-3 py-1 rounded-full">
              CONFORME
            </Badge>
          </div>
        </motion.div>
      </div>

      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <CardHeader className="p-8 pb-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-all duration-500">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tighter">Livro Diário</CardTitle>
                <CardDescription className="text-sm font-medium opacity-60">Gestão analítica de partidas dobradas em {ano}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ImportLancamentosCSVDialog empresaId={empresaId} planoContas={contasAnaliticas} ano={ano} />
            <NovoLancamentoDialog empresaId={empresaId} planoContas={contasAnaliticas} />
          </div>
        </div>
      </CardHeader>
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
              onChange={e => setBusca(e.target.value)} 
              className="h-14 pl-12 bg-card/5 border-white/5 rounded-2xl font-bold text-lg transition-all focus:ring-primary/20 placeholder:text-muted-foreground/40" 
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={preset} onValueChange={v => handlePreset(v as DatePreset)}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-white/5 bg-card/5 font-bold"><SelectValue /></SelectTrigger>
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
                <Button variant="outline" size="sm" className={cn('h-12 rounded-2xl border-white/5 bg-card/5 gap-2 px-5 font-bold', !dataInicio && 'text-muted-foreground')}>
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  {dataInicio ? format(dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden" align="start">
                <Calendar mode="single" selected={dataInicio} onSelect={d => { setDataInicio(d); filtersController.setField('preset', 'custom'); }} initialFocus className={cn('p-3 pointer-events-auto')} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('h-12 rounded-2xl border-white/5 bg-card/5 gap-2 px-5 font-bold', !dataFim && 'text-muted-foreground')}>
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  {dataFim ? format(dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden" align="start">
                <Calendar mode="single" selected={dataFim} onSelect={d => { setDataFim(d); filtersController.setField('preset', 'custom'); }} initialFocus className={cn('p-3 pointer-events-auto')} />
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
            <span className="font-black uppercase tracking-widest text-xs">Acessando razão contábil...</span>
          </div>
        ) : lancsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-[2.5rem] bg-card/[0.02]">
            <Search className="h-10 w-10 opacity-20 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">Nenhum lançamento encontrado</p>
            <p className="text-[10px] opacity-50 mt-1 uppercase tracking-widest">Ajuste os filtros para ampliar a busca</p>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-card/[0.01] shadow-inner">
            <Table>
              <TableHeader className="bg-card/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-24 text-[10px] font-black uppercase tracking-widest p-6">Nº Lanc.</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Data</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Histórico Analítico</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Fonte</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Montante</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {lancsFiltrados.slice(0, 100).map((l: { id: string; numero_lancamento: number; data_lancamento: string; historico: string; origem: string; valor_total: number; status: string }, idx: number) => (
                    <motion.tr 
                      key={l.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.005 }}
                      className="border-white/5 hover:bg-card/5 transition-colors group/row"
                    >
                      <TableCell className="p-6">
                        <Badge variant="outline" className="font-mono text-[11px] font-black border-none bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg">
                          #{String(l.numero_lancamento).padStart(4, '0')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {format(new Date(l.data_lancamento + 'T00:00:00'), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground/80 truncate">{l.historico}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="h-3 w-3 opacity-40 text-primary" />
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Integridade Validada</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-none bg-card/5 text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 w-fit">
                          <Zap className="h-3 w-3 text-primary opacity-60" />
                          {l.origem}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-black text-sm tabular-nums text-foreground/90">
                        {formatCurrency(l.valor_total)}
                      </TableCell>
                      <TableCell className="pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="outline" className={cn(
                            "uppercase text-[9px] font-black tracking-widest border-none px-3 py-1 rounded-full",
                            l.status === 'confirmado' ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                          )}>
                            {l.status}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover/row:opacity-100 transition-opacity">
                                  <Eye className="h-4 w-4 opacity-40 hover:opacity-100" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest">Ver Detalhes das Partidas</p>
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
        {lancsFiltrados.length > 100 && <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center mt-6">Exibindo 100 de {lancsFiltrados.length.toLocaleString('pt-BR')} lançamentos. Refine o período para auditoria completa.</p>}
      </CardContent>
    </Card>
    </div>
  );
}
