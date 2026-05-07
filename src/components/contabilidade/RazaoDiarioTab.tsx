import { useEffect, useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookText, CalendarIcon, Download, FileSpreadsheet, FileText, Search, Wand2, Filter, ChevronDown, CheckCircle2, AlertTriangle, BookOpen, Activity, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useEmpresas } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  exportDiarioCSV,
  exportDiarioPDF,
  exportRazaoCSV,
  exportRazaoPDF,
  type EmpresaHeader,
} from '@/lib/export-contabil';
import { toast } from 'sonner';

interface Props { empresaId?: string; ano: number }

interface PartidaFlat {
  data: string;
  numero: number | null;
  historico: string;
  conta_id: string;
  conta_codigo: string;
  conta_nome: string;
  debito: number;
  credito: number;
}

type DatePreset = 'all' | 'today' | 'last7' | 'last30' | 'mes' | 'ano' | 'custom';

const toIsoDate = (d: Date) => format(d, 'yyyy-MM-dd');

interface RazaoFilters extends Record<string, unknown> {
  preset: DatePreset;
  dataInicio: string;
  dataFim: string;
  contaId: string;
  busca: string;
}

export function RazaoDiarioTab({ empresaId, ano }: Props) {
  const [modo, setModo] = useState<'diario' | 'razao'>('diario');

  const defaults = useMemo<RazaoFilters>(() => ({
    preset: 'ano',
    dataInicio: `${ano}-01-01`,
    dataFim: `${ano}-12-31`,
    contaId: 'todas',
    busca: '',
  }), [ano]);

  const filtersController = useManagedFilters<RazaoFilters>({
    entityType: 'razao-diario',
    defaults,
    localStorageKey: 'app-razao-diario-filters',
  });
  const { preset, dataInicio, dataFim, contaId, busca } = filtersController.values;
  const setPreset = (p: DatePreset) => filtersController.setField('preset', p);
  const setDataInicio = (v: string) => filtersController.setField('dataInicio', v);
  const setDataFim = (v: string) => filtersController.setField('dataFim', v);
  const setContaId = (v: string) => filtersController.setField('contaId', v);
  const setBusca = (v: string) => filtersController.setField('busca', v);

  // Quando o ano muda na página pai, recompõe o intervalo padrão "Ano de X" — só após hidratar.
  useEffect(() => {
    if (!filtersController.isHydrated) return;
    if (preset === 'ano') {
      filtersController.setValues({
        ...filtersController.values,
        dataInicio: `${ano}-01-01`,
        dataFim: `${ano}-12-31`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, filtersController.isHydrated]);

  const handlePreset = (p: DatePreset) => {
    const hoje = new Date();
    let ini = dataInicio; let fim = dataFim;
    switch (p) {
      case 'all': ini = `${ano}-01-01`; fim = `${ano}-12-31`; break;
      case 'today': ini = toIsoDate(startOfDay(hoje)); fim = toIsoDate(endOfDay(hoje)); break;
      case 'last7': ini = toIsoDate(startOfDay(subDays(hoje, 6))); fim = toIsoDate(endOfDay(hoje)); break;
      case 'last30': ini = toIsoDate(startOfDay(subDays(hoje, 29))); fim = toIsoDate(endOfDay(hoje)); break;
      case 'mes': ini = toIsoDate(startOfMonth(hoje)); fim = toIsoDate(endOfMonth(hoje)); break;
      case 'ano': ini = toIsoDate(startOfYear(new Date(ano, 0, 1))); fim = toIsoDate(endOfYear(new Date(ano, 0, 1))); break;
      case 'custom': filtersController.setField('preset', p); return;
    }
    filtersController.setValues({ ...filtersController.values, preset: p, dataInicio: ini, dataFim: fim });
  };

  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);
  const { data: empresas = [] } = useEmpresas();
  const empresaHeader = useMemo<EmpresaHeader | undefined>(() => {
    const e = (empresas as Array<Record<string, unknown>>).find((x) => x.id === empresaId);
    if (!e) return undefined;
    return {
      razao_social: (e.razao_social as string) ?? null,
      nome_fantasia: (e.nome_fantasia as string) ?? null,
      cnpj: (e.cnpj as string) ?? null,
    };
  }, [empresas, empresaId]);

  // Achata todas as partidas com metadados do lançamento
  const todasPartidas = useMemo<PartidaFlat[]>(() => {
    const arr: PartidaFlat[] = [];
    for (const l of lancs as Array<Record<string, unknown>>) {
      const partidas = (l.partidas as Array<Record<string, unknown>>) || [];
      for (const p of partidas) {
        const conta = (p.conta as Record<string, unknown>) || {};
        const valor = Number(p.valor) || 0;
        arr.push({
          data: String(l.data_lancamento),
          numero: (l.numero_lancamento as number) ?? null,
          historico: String(l.historico ?? ''),
          conta_id: String(p.conta_id ?? ''),
          conta_codigo: String(conta.codigo ?? ''),
          conta_nome: String(conta.nome ?? conta.descricao ?? ''),
          debito: p.tipo === 'D' ? valor : 0,
          credito: p.tipo === 'C' ? valor : 0,
        });
      }
    }
    return arr;
  }, [lancs]);

  const partidasFiltradas = useMemo(() => {
    const ini = new Date(`${dataInicio}T00:00:00`);
    const fim = new Date(`${dataFim}T23:59:59`);
    const term = busca.trim().toLowerCase();
    return todasPartidas.filter((p) => {
      const d = new Date(`${p.data}T00:00:00`);
      if (d < ini || d > fim) return false;
      if (contaId !== 'todas' && p.conta_id !== contaId) return false;
      if (term && !`${p.historico} ${p.conta_codigo} ${p.conta_nome}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [todasPartidas, dataInicio, dataFim, contaId, busca]);

  // Diário ordenado cronologicamente
  const diario = useMemo(
    () => [...partidasFiltradas].sort((a, b) => a.data.localeCompare(b.data)),
    [partidasFiltradas],
  );

  const totaisDiario = useMemo(() => {
    return diario.reduce(
      (acc, p) => ({ debito: acc.debito + p.debito, credito: acc.credito + p.credito }),
      { debito: 0, credito: 0 },
    );
  }, [diario]);

  // Razão: agrupado por conta, com saldo inicial calculado
  const razao = useMemo(() => {
    const ini = new Date(`${dataInicio}T00:00:00`);
    // saldo inicial = movimentos antes do período
    const saldoInicialMap = new Map<string, number>();
    for (const p of todasPartidas) {
      if (contaId !== 'todas' && p.conta_id !== contaId) continue;
      const d = new Date(`${p.data}T00:00:00`);
      if (d < ini) {
        saldoInicialMap.set(p.conta_id, (saldoInicialMap.get(p.conta_id) || 0) + p.debito - p.credito);
      }
    }

    const grupos = new Map<string, { conta_id: string; codigo: string; nome: string; saldo_inicial: number; movs: PartidaFlat[] }>();
    for (const p of partidasFiltradas) {
      let g = grupos.get(p.conta_id);
      if (!g) {
        g = {
          conta_id: p.conta_id,
          codigo: p.conta_codigo,
          nome: p.conta_nome,
          saldo_inicial: saldoInicialMap.get(p.conta_id) || 0,
          movs: [],
        };
        grupos.set(p.conta_id, g);
      }
      g.movs.push(p);
    }
    // ordena movimentos cronologicamente
    for (const g of grupos.values()) {
      g.movs.sort((a, b) => a.data.localeCompare(b.data));
    }
    return Array.from(grupos.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [partidasFiltradas, todasPartidas, dataInicio, contaId]);

  const ctxExport = { empresa: empresaHeader, dataInicio, dataFim };

  const exportarDiario = (formato: 'csv' | 'pdf') => {
    if (diario.length === 0) {
      toast.warning('Nada para exportar.');
      return;
    }
    if (formato === 'csv') exportDiarioCSV(diario, ctxExport);
    else exportDiarioPDF(diario, ctxExport);
    toast.success(`Diário exportado (${diario.length} partidas).`);
  };

  const exportarRazao = (formato: 'csv' | 'pdf') => {
    if (razao.length === 0) {
      toast.warning('Nada para exportar.');
      return;
    }
    if (formato === 'csv') exportRazaoCSV(razao, ctxExport);
    else exportRazaoPDF(razao, ctxExport);
    toast.success(`Razão exportado (${razao.length} contas).`);
  };

  const exportar = (formato: 'csv' | 'pdf') => (modo === 'diario' ? exportarDiario(formato) : exportarRazao(formato));

  if (!empresaId) {
    return (
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardContent className="relative z-10 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-3xl w-fit mx-auto animate-pulse">
            <BookText className="h-12 w-12 text-primary opacity-40" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black tracking-tight">Razão & Diário</p>
            <p className="text-sm font-medium opacity-60 max-w-xs mx-auto">Selecione uma empresa para visualizar os demonstrativos analíticos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <CardHeader className="p-8 pb-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={cn("p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-all duration-500")}>
              <BookText className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tighter">Razão & Diário</CardTitle>
              <CardDescription className="text-sm font-medium opacity-60">Demonstrativos contábeis detalhados por período</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-2 relative z-10 space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[320px] group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
            <Input 
              placeholder="Buscar por histórico ou conta..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="h-14 pl-12 bg-white/5 border-white/5 rounded-2xl font-bold text-lg transition-all focus:ring-primary/20 placeholder:text-muted-foreground/40" 
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={preset} onValueChange={(v) => handlePreset(v as DatePreset)}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-white/5 bg-white/5 font-bold"><SelectValue /></SelectTrigger>
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
                <Button variant="outline" size="sm" className={cn('h-12 rounded-2xl border-white/5 bg-white/5 gap-2 px-5 font-bold', !dataInicio && 'text-muted-foreground')}>
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  {dataInicio ? format(new Date(`${dataInicio}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR }) : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio ? new Date(`${dataInicio}T00:00:00`) : undefined}
                  onSelect={(d) => { if (d) { setDataInicio(toIsoDate(d)); setPreset('custom'); } }}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('h-12 rounded-2xl border-white/5 bg-white/5 gap-2 px-5 font-bold', !dataFim && 'text-muted-foreground')}>
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  {dataFim ? format(new Date(`${dataFim}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-none shadow-3xl rounded-3xl overflow-hidden" align="start">
                <Calendar
                  mode="single"
                  selected={dataFim ? new Date(`${dataFim}T00:00:00`) : undefined}
                  onSelect={(d) => { if (d) { setDataFim(toIsoDate(d)); setPreset('custom'); } }}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Select value={contaId} onValueChange={setContaId}>
            <SelectTrigger className="h-12 w-[220px] rounded-2xl border-white/5 bg-white/5 font-bold">
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

          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 bg-white/5 px-5 py-4 rounded-2xl border border-white/5 ml-auto">
            {modo === 'diario'
              ? `${diario.length.toLocaleString('pt-BR')} partidas`
              : `${razao.length.toLocaleString('pt-BR')} contas`}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 bg-white/[0.03] p-4 rounded-3xl border border-white/5">
          <div className="flex items-center gap-4">
            <ToggleGroup type="single" value={modo} onValueChange={(v) => v && setModo(v as 'diario' | 'razao')} className="bg-background/40 p-1 rounded-2xl border border-white/5">
              <ToggleGroupItem value="diario" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-6 font-black uppercase text-[10px] tracking-widest">Diário</ToggleGroupItem>
              <ToggleGroupItem value="razao" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-6 font-black uppercase text-[10px] tracking-widest">Razão</ToggleGroupItem>
            </ToggleGroup>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
              <ArrowRightLeft className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Filtros Cruzados Ativos
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-10 rounded-2xl font-black gap-2 border-white/10 bg-white/5 hover:bg-white/10 px-6 transition-all hover:translate-y-[-2px]">
                <Download className="h-4 w-4 text-primary" /> Exportar Livros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Selecionar Formato</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={() => exportar('csv')} className="rounded-xl gap-3 py-3 cursor-pointer">
                <div className="p-2 bg-success/20 rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-success" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Excel (.csv)</span>
                  <span className="text-[10px] opacity-50">Auditoria & Planilhas</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportar('pdf')} className="rounded-xl gap-3 py-3 cursor-pointer">
                <div className="p-2 bg-destructive/20 rounded-lg">
                  <FileText className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Documento (.pdf)</span>
                  <span className="text-[10px] opacity-50">Relatório de Governança</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-12">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-12 w-24 rounded-xl" />
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <Skeleton className="h-12 w-32 rounded-xl" />
              </div>
            ))}
          </div>
        ) : modo === 'diario' ? (
          diario.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02]">
              <Activity className="h-10 w-10 opacity-20 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Nenhuma partida no período</p>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-white/[0.01] shadow-inner">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest p-6">Data</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Nº</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Histórico</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Conta Contábil</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Débito</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Crédito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {diario.slice(0, 1000).map((p, i) => (
                      <motion.tr 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i % 20) * 0.005 }}
                        className="border-white/5 hover:bg-white/5 transition-colors group/row"
                      >
                        <TableCell className="p-6 text-[10px] font-black uppercase tracking-widest opacity-60">
                          {format(new Date(`${p.data}T00:00:00`), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono font-black text-[10px] border-none bg-primary/10 text-primary px-2 rounded-lg">
                            {p.numero ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate font-bold text-foreground/80" title={p.historico}>{p.historico}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] font-black text-primary">{p.conta_codigo}</span>
                            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest truncate max-w-[200px]">{p.conta_nome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-xs tabular-nums text-success">
                          {p.debito ? formatCurrency(p.debito) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-xs tabular-nums text-destructive">
                          {p.credito ? formatCurrency(p.credito) : '—'}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-semibold">Totais</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(totaisDiario.debito)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(totaisDiario.credito)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} className="py-2">
                    {(() => {
                      const diff = totaisDiario.debito - totaisDiario.credito;
                      const ok = Math.abs(diff) < 0.01;
                      return (
                        <div
                          className={`flex flex-wrap items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                            ok
                              ? 'bg-success/10 text-success border border-success/20'
                              : 'bg-warning/10 text-warning border border-warning/20'
                          }`}
                          role="status"
                          aria-live="polite"
                        >
                          <span aria-hidden>{ok ? '✓' : '⚠'}</span>
                          {ok ? (
                            <span>
                              Validação OK · Débitos = Créditos = {formatCurrency(totaisDiario.debito)}
                            </span>
                          ) : (
                            <span>
                              Partidas dobradas não fecham · Diferença: {formatCurrency(Math.abs(diff))}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )) : razao.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02]">
            <Activity className="h-10 w-10 opacity-20 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">Nenhuma conta com movimento</p>
          </div>
        ) : (
          <div className="space-y-10">
            {(() => {
              let gSaldoInicial = 0;
              let gDebitos = 0;
              let gCreditos = 0;
              let gSaldoFinal = 0;
              const cards = razao.map((g, idx) => {
                let saldo = g.saldo_inicial;
                let dTotal = 0;
                let cTotal = 0;
                const linhas = g.movs.map((m) => {
                  saldo += m.debito - m.credito;
                  dTotal += m.debito;
                  cTotal += m.credito;
                  return { ...m, saldoAcumulado: saldo };
                });
                const saldoFinal = saldo;
                const saldoCalculado = g.saldo_inicial + dTotal - cTotal;
                const diff = saldoFinal - saldoCalculado;
                const ok = Math.abs(diff) < 0.01;

                gSaldoInicial += g.saldo_inicial;
                gDebitos += dTotal;
                gCreditos += cTotal;
                gSaldoFinal += saldoFinal;

                return (
                  <motion.div 
                    key={g.conta_id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (idx % 10) * 0.05 }}
                    className="border-none bg-white/[0.02] shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/5 group/card"
                  >
                    <div className="bg-white/5 p-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-2xl group-hover/card:scale-110 transition-transform">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-black text-primary tracking-tighter">{g.codigo}</p>
                          <p className="text-sm font-black uppercase tracking-widest opacity-80">{g.nome}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="h-10 rounded-xl font-mono font-black border-none bg-white/5 px-4 text-xs">
                        Saldo Inicial: {formatCurrency(g.saldo_inicial)}
                      </Badge>
                    </div>
                    <div className="overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/[0.01]">
                          <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-[9px] font-black uppercase tracking-widest p-4 pl-6">Data</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-widest">Histórico</TableHead>
                            <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Débito</TableHead>
                            <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Crédito</TableHead>
                            <TableHead className="text-right text-[9px] font-black uppercase tracking-widest pr-6">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {linhas.map((m, i) => (
                          <TableRow key={i}>
                            <TableCell className="whitespace-nowrap">{format(new Date(`${m.data}T00:00:00`), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="max-w-[300px] truncate" title={m.historico}>{m.historico}</TableCell>
                            <TableCell className="text-right font-mono">{m.debito ? formatCurrency(m.debito) : '—'}</TableCell>
                            <TableCell className="text-right font-mono">{m.credito ? formatCurrency(m.credito) : '—'}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(m.saldoAcumulado)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2} className="font-semibold">Totais do período</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(dTotal)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(cTotal)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">{formatCurrency(saldoFinal)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} className="py-2">
                            <div
                              className={`flex flex-wrap items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                                ok
                                  ? 'bg-success/10 text-success border border-success/20'
                                  : 'bg-warning/10 text-warning border border-warning/20'
                              }`}
                              role="status"
                              aria-live="polite"
                            >
                              <span aria-hidden>{ok ? '✓' : '⚠'}</span>
                              <span className="font-mono">
                                {formatCurrency(g.saldo_inicial)} + {formatCurrency(dTotal)} − {formatCurrency(cTotal)} = {formatCurrency(saldoCalculado)}
                              </span>
                              {ok ? (
                                <span>· bate com o saldo final</span>
                              ) : (
                                <span>· divergência de {formatCurrency(Math.abs(diff))} no saldo final</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </motion.div>
                );
              });

              const gSaldoCalc = gSaldoInicial + gDebitos - gCreditos;
              const gDiff = gSaldoFinal - gSaldoCalc;
              const gOk = Math.abs(gDiff) < 0.01 && Math.abs(gDebitos - gCreditos) < 0.01;

              return (
                <>
                  {cards}
                  <div
                    className={`rounded-md border px-4 py-3 ${
                      gOk
                        ? 'bg-success/5 border-success/30'
                        : 'bg-warning/5 border-warning/30'
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span aria-hidden>{gOk ? '✓' : '⚠'}</span>
                        <span className={gOk ? 'text-success' : 'text-warning'}>
                          {gOk ? 'Razão consistente' : 'Razão com divergência'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs">
                        <div>
                          <span className="text-muted-foreground">Saldo inicial:</span>{' '}
                          <span className="font-mono font-semibold">{formatCurrency(gSaldoInicial)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Débitos:</span>{' '}
                          <span className="font-mono font-semibold">{formatCurrency(gDebitos)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Créditos:</span>{' '}
                          <span className="font-mono font-semibold">{formatCurrency(gCreditos)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Saldo final:</span>{' '}
                          <span className="font-mono font-semibold">{formatCurrency(gSaldoFinal)}</span>
                        </div>
                      </div>
                    </div>
                    {!gOk && (
                      <p className="mt-2 text-xs text-warning">
                        Diferença total: {formatCurrency(Math.abs(gDiff))} · Débitos − Créditos = {formatCurrency(gDebitos - gCreditos)}
                      </p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
