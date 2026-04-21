import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Search, CalendarIcon, X } from 'lucide-react';
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

export function LancamentosTab({ empresaId, ano }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [historico, setHistorico] = useState('');
  const [partidas, setPartidas] = useState<PartidaForm[]>([
    { conta_id: '', tipo: 'D', valor: 0 },
    { conta_id: '', tipo: 'C', valor: 0 },
  ]);

  // Filtros
  const [busca, setBusca] = useState('');
  const [preset, setPreset] = useState<DatePreset>('all');
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);
  const criar = useCriarLancamento();

  const contasAnaliticas = plano.filter(p => p.tipo === 'analitica');
  const totalD = partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
  const totalC = partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
  const balanceado = Math.abs(totalD - totalC) < 0.01 && totalD > 0;

  const handlePreset = (p: DatePreset) => {
    setPreset(p);
    const hoje = new Date();
    switch (p) {
      case 'all': setDataInicio(undefined); setDataFim(undefined); break;
      case 'today': setDataInicio(startOfDay(hoje)); setDataFim(endOfDay(hoje)); break;
      case 'last7': setDataInicio(startOfDay(subDays(hoje, 6))); setDataFim(endOfDay(hoje)); break;
      case 'last30': setDataInicio(startOfDay(subDays(hoje, 29))); setDataFim(endOfDay(hoje)); break;
      case 'mes': setDataInicio(startOfMonth(hoje)); setDataFim(endOfMonth(hoje)); break;
      case 'ano': setDataInicio(startOfYear(new Date(ano, 0, 1))); setDataFim(endOfYear(new Date(ano, 0, 1))); break;
      case 'custom': break;
    }
  };

  const limparFiltros = () => { setBusca(''); setPreset('all'); setDataInicio(undefined); setDataFim(undefined); };
  const filtrosAtivos = busca !== '' || dataInicio !== undefined || dataFim !== undefined;

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lançamentos Contábeis · {ano}</CardTitle>
            <CardDescription>Partidas dobradas — débitos = créditos</CardDescription>
          </div>
          <div className="flex gap-2">
            <ImportLancamentosCSVDialog empresaId={empresaId} planoContas={contasAnaliticas} ano={ano} />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button disabled={!empresaId}><Plus className="h-4 w-4 mr-2" />Novo lançamento</Button></DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Novo lançamento contábil</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
                </div>
                <div><Label>Histórico</Label><Input value={historico} onChange={e => setHistorico(e.target.value)} placeholder="Ex: Pagamento de fornecedor NF 12345" /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Partidas</Label>
                    <Button size="sm" variant="outline" onClick={() => setPartidas([...partidas, { conta_id: '', tipo: 'D', valor: 0 }])}>
                      <Plus className="h-3 w-3 mr-1" />Linha
                    </Button>
                  </div>
                  {partidas.map((p, i) => (
                    <div key={i} className="grid grid-cols-[1fr_100px_140px_40px] gap-2 items-center">
                      <Select value={p.conta_id} onValueChange={v => setPartidas(partidas.map((x, j) => j === i ? { ...x, conta_id: v } : x))}>
                        <SelectTrigger><SelectValue placeholder="Conta..." /></SelectTrigger>
                        <SelectContent>
                          {contasAnaliticas.map(c => <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.descricao}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={p.tipo} onValueChange={v => setPartidas(partidas.map((x, j) => j === i ? { ...x, tipo: v as 'D' | 'C' } : x))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="D">Débito</SelectItem>
                          <SelectItem value="C">Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" step="0.01" value={p.valor} onChange={e => setPartidas(partidas.map((x, j) => j === i ? { ...x, valor: Number(e.target.value) } : x))} />
                      <Button size="icon" variant="ghost" onClick={() => setPartidas(partidas.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className={`flex justify-between text-sm p-2 rounded ${balanceado ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'}`}>
                    <span>D: {formatCurrency(totalD)}</span>
                    <span>C: {formatCurrency(totalC)}</span>
                    <span>{balanceado ? '✓ Balanceado' : `Diferença: ${formatCurrency(Math.abs(totalD - totalC))}`}</span>
                  </div>
                </div>
                <Button onClick={handleSalvar} disabled={!balanceado || !historico || criar.isPending} className="w-full">Salvar lançamento</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por histórico ou nº..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={preset} onValueChange={v => handlePreset(v as DatePreset)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
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
              <Button variant="outline" size="sm" className={cn('gap-2', !dataInicio && 'text-muted-foreground')}>
                <CalendarIcon className="h-4 w-4" />
                {dataInicio ? format(dataInicio, 'dd/MM/yyyy', { locale: ptBR }) : 'Início'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dataInicio} onSelect={d => { setDataInicio(d); setPreset('custom'); }} initialFocus className={cn('p-3 pointer-events-auto')} />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('gap-2', !dataFim && 'text-muted-foreground')}>
                <CalendarIcon className="h-4 w-4" />
                {dataFim ? format(dataFim, 'dd/MM/yyyy', { locale: ptBR }) : 'Fim'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dataFim} onSelect={d => { setDataFim(d); setPreset('custom'); }} initialFocus className={cn('p-3 pointer-events-auto')} />
            </PopoverContent>
          </Popover>

          {filtrosAtivos && (
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-1">
              <X className="h-3.5 w-3.5" />Limpar
            </Button>
          )}

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
