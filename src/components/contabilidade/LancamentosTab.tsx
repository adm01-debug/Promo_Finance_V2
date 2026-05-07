import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Search, CalendarIcon, Wand2, Filter, ChevronDown, CheckCircle2, AlertTriangle, Activity, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useLancamentosContabeis, useCriarLancamento } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ImportLancamentosCSVDialog } from './ImportLancamentosCSVDialog';

interface Props { empresaId?: string; ano: number }

interface PartidaForm { conta_id: string; tipo: 'D' | 'C'; valor: number }

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
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [historico, setHistorico] = useState('');
  const [partidas, setPartidas] = useState<PartidaForm[]>([
    { conta_id: '', tipo: 'D', valor: 0 },
    { conta_id: '', tipo: 'C', valor: 0 },
  ]);

  // Filtros gerenciados
  const filtersController = useManagedFilters<LancamentosFilters>({
    entityType: 'lancamentos-contabeis',
    defaults: LANCAMENTOS_DEFAULTS,
    localStorageKey: 'app-lancamentos-filters',
  });
  const { busca, preset, dataInicio: dataInicioStr, dataFim: dataFimStr } = filtersController.values;
  const dataInicio = dataInicioStr ? new Date(`${dataInicioStr}T00:00:00`) : undefined;
  const dataFim = dataFimStr ? new Date(`${dataFimStr}T23:59:59`) : undefined;
  const setBusca = (v: string) => filtersController.setField('busca', v);
  const setDataInicio = (d: Date | undefined) => filtersController.setField('dataInicio', d ? format(d, 'yyyy-MM-dd') : null);
  const setDataFim = (d: Date | undefined) => filtersController.setField('dataFim', d ? format(d, 'yyyy-MM-dd') : null);

  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);
  const criar = useCriarLancamento();

  const contasAnaliticas = plano.filter(p => p.tipo === 'analitica');
  const totalD = partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
  const totalC = partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
  const balanceado = Math.abs(totalD - totalC) < 0.01 && totalD > 0;

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
    filtersController.setValues({
      ...filtersController.values,
      preset: p,
      dataInicio: ini ? format(ini, 'yyyy-MM-dd') : null,
      dataFim: fim ? format(fim, 'yyyy-MM-dd') : null,
    });
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

  const handleSalvar = async () => {
    if (!empresaId || !balanceado) return;
    await criar.mutateAsync({
      empresa_id: empresaId, data_lancamento: data, historico,
      partidas: partidas.filter(p => p.conta_id && p.valor > 0),
    });
    setOpen(false); setHistorico(''); setPartidas([{ conta_id: '', tipo: 'D', valor: 0 }, { conta_id: '', tipo: 'C', valor: 0 }]);
  };

  return (
    <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <CardHeader className="p-8 pb-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-all duration-500">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tighter">Lançamentos Contábeis · {ano}</CardTitle>
              <CardDescription className="text-sm font-medium opacity-60">Partidas dobradas — débitos = créditos</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ImportLancamentosCSVDialog empresaId={empresaId} planoContas={contasAnaliticas} ano={ano} />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={!empresaId} className="h-12 rounded-2xl font-black px-6 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]">
                  <Plus className="h-5 w-5 mr-2" />
                  Novo Lançamento
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl border-none bg-background/95 backdrop-blur-2xl shadow-3xl rounded-[2.5rem] p-8 overflow-hidden">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <Plus className="h-6 w-6 text-primary" />
                  Novo Lançamento Contábil
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Data do Lançamento</Label>
                    <Input type="date" value={data} onChange={e => setData(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl font-bold transition-all focus:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Histórico / Descrição</Label>
                  <Input value={historico} onChange={e => setHistorico(e.target.value)} placeholder="Ex: Pagamento de fornecedor NF 12345" className="h-12 bg-white/5 border-white/10 rounded-xl font-bold transition-all focus:ring-primary/20" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Composição de Partidas</Label>
                    <Button size="sm" variant="outline" onClick={() => setPartidas([...partidas, { conta_id: '', tipo: 'D', valor: 0 }])} className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 gap-2 font-bold h-9">
                      <Plus className="h-4 w-4 text-primary" />Adicionar Linha
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {partidas.map((p, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-[1fr_120px_160px_40px] gap-3 items-center group"
                      >
                        <Select value={p.conta_id} onValueChange={v => setPartidas(partidas.map((x, j) => j === i ? { ...x, conta_id: v } : x))}>
                          <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5 font-bold transition-all focus:ring-primary/20"><SelectValue placeholder="Selecionar Conta..." /></SelectTrigger>
                          <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                            {contasAnaliticas.map(c => <SelectItem key={c.id} value={c.id} className="font-mono text-xs">{c.codigo} — {c.descricao}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={p.tipo} onValueChange={v => setPartidas(partidas.map((x, j) => j === i ? { ...x, tipo: v as 'D' | 'C' } : x))}>
                          <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5 font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-xl">
                            <SelectItem value="D" className="text-success font-black">Débito</SelectItem>
                            <SelectItem value="C" className="text-destructive font-black">Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="number" step="0.01" value={p.valor} onChange={e => setPartidas(partidas.map((x, j) => j === i ? { ...x, valor: Number(e.target.value) } : x))} className="h-12 bg-white/5 border-white/10 rounded-xl font-mono text-right font-black transition-all focus:ring-primary/20" />
                        <Button size="icon" variant="ghost" onClick={() => setPartidas(partidas.filter((_, j) => j !== i))} className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                  <div className={cn(
                    "flex flex-wrap justify-between items-center gap-4 p-5 rounded-2xl border backdrop-blur-md transition-all shadow-lg",
                    balanceado ? 'bg-success/5 border-success/20 text-success shadow-success/10' : 'bg-warning/5 border-warning/20 text-warning shadow-warning/10'
                  )}>
                    <div className="flex gap-6">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Débito</p>
                        <p className="font-mono font-black text-xl">{formatCurrency(totalD)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Total Crédito</p>
                        <p className="font-mono font-black text-xl">{formatCurrency(totalC)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {balanceado ? (
                        <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest bg-success/20 px-4 py-2 rounded-full">
                          <CheckCircle2 className="h-4 w-4" /> Consistente
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest bg-warning/20 px-4 py-2 rounded-full">
                          <AlertTriangle className="h-4 w-4" /> Dif: {formatCurrency(Math.abs(totalD - totalC))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSalvar} 
                  disabled={!balanceado || !historico || criar.isPending} 
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                >
                  {criar.isPending ? <Wand2 className="h-5 w-5 animate-spin mr-2" /> : "Registrar Lançamento"}
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[320px] group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within/search:text-primary" />
            <Input 
              placeholder="Buscar por histórico ou nº do lançamento..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="h-14 pl-12 bg-white/5 border-white/5 rounded-2xl font-bold text-lg transition-all focus:ring-primary/20 placeholder:text-muted-foreground/40" 
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={preset} onValueChange={v => handlePreset(v as DatePreset)}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-white/5 bg-white/5 font-bold"><SelectValue /></SelectTrigger>
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
                <Button variant="outline" size="sm" className={cn('h-12 rounded-2xl border-white/5 bg-white/5 gap-2 px-5 font-bold', !dataInicio && 'text-muted-foreground')}>
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
                <Button variant="outline" size="sm" className={cn('h-12 rounded-2xl border-white/5 bg-white/5 gap-2 px-5 font-bold', !dataFim && 'text-muted-foreground')}>
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

          <div className="ml-auto text-xs text-muted-foreground">
            {lancsFiltrados.length} de {lancs.length} {lancs.length === 1 ? 'lançamento' : 'lançamentos'}
          </div>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : lancsFiltrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {lancs.length === 0 ? `Nenhum lançamento contábil em ${ano}.` : 'Nenhum lançamento corresponde aos filtros aplicados.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead><TableHead>Data</TableHead><TableHead>Histórico</TableHead>
                <TableHead>Origem</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancsFiltrados.slice(0, 100).map((l: { id: string; numero_lancamento: number; data_lancamento: string; historico: string; origem: string; valor_total: number; status: string }) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono">{l.numero_lancamento}</TableCell>
                  <TableCell>{format(new Date(l.data_lancamento + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="max-w-md truncate">{l.historico}</TableCell>
                  <TableCell><Badge variant="outline">{l.origem}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(l.valor_total)}</TableCell>
                  <TableCell><Badge variant={l.status === 'confirmado' ? 'default' : 'secondary'}>{l.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {lancsFiltrados.length > 100 && <p className="text-xs text-muted-foreground mt-2">Exibindo 100 de {lancsFiltrados.length}</p>}
      </CardContent>
    </Card>
  );
}
