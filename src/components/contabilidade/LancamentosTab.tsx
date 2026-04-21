import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLancamentosContabeis, useCriarLancamento } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { formatCurrency } from '@/lib/formatters';

interface Props { empresaId?: string; ano: number }

interface PartidaForm { conta_id: string; tipo: 'D' | 'C'; valor: number }

export function LancamentosTab({ empresaId, ano }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [historico, setHistorico] = useState('');
  const [partidas, setPartidas] = useState<PartidaForm[]>([
    { conta_id: '', tipo: 'D', valor: 0 },
    { conta_id: '', tipo: 'C', valor: 0 },
  ]);

  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);
  const criar = useCriarLancamento();

  const contasAnaliticas = plano.filter(p => p.tipo === 'analitica');
  const totalD = partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
  const totalC = partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
  const balanceado = Math.abs(totalD - totalC) < 0.01 && totalD > 0;

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
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : lancs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento contábil em {ano}.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead><TableHead>Data</TableHead><TableHead>Histórico</TableHead>
                <TableHead>Origem</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancs.slice(0, 100).map((l: { id: string; numero_lancamento: number; data_lancamento: string; historico: string; origem: string; valor_total: number; status: string }) => (
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
        {lancs.length > 100 && <p className="text-xs text-muted-foreground mt-2">Exibindo 100 de {lancs.length}</p>}
      </CardContent>
    </Card>
  );
}
