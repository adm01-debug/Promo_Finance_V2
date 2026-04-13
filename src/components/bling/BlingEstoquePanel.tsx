import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Warehouse, MapPin, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { useBlingEstoque, useBlingDepositos, useBlingEstoqueMutations } from '@/hooks/useBling';
import { LoadingSkeleton } from './BlingShared';

export function BlingEstoquePanel() {
  const { data, refetch, isFetching } = useBlingEstoque();
  const { data: depositosData, refetch: refetchDepositos, isFetching: fetchingDepositos } = useBlingDepositos();
  const { lancarEstoque, criarDeposito } = useBlingEstoqueMutations();
  const saldos = data?.data || [];
  const depositos = depositosData?.data || [];

  const [showLancar, setShowLancar] = useState(false);
  const [showDeposito, setShowDeposito] = useState(false);
  const [lancForm, setLancForm] = useState({ idProduto: '', quantidade: '', idDeposito: '', operacao: 'E', observacoes: '' });
  const [depForm, setDepForm] = useState({ descricao: '', situacao: 'A' });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5" /> Saldos de Estoque</CardTitle>
              <CardDescription>Saldos físico e virtual por produto nos depósitos do Bling</CardDescription>
            </div>
            <Button onClick={() => setShowLancar(true)} variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" /> Lançar Movimentação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Carregar Saldos
          </Button>
          {saldos.length === 0 && !isFetching && (
            <EmptyState icon={Warehouse} title="Nenhum saldo" description="Carregue os saldos de estoque do Bling" />
          )}
          {saldos.length > 0 && (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Saldo Físico</TableHead>
                    <TableHead className="text-right">Saldo Virtual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saldos.map((s: any) => (
                    <TableRow key={s.produto?.id}>
                      <TableCell className="font-medium">{s.produto?.nome || `#${s.produto?.id}`}</TableCell>
                      <TableCell className="font-mono text-xs">{s.produto?.codigo || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">{s.saldoFisicoTotal ?? 0}</TableCell>
                      <TableCell className="text-right">{s.saldoVirtualTotal ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Depósitos</CardTitle>
              <CardDescription>Armazéns cadastrados no Bling</CardDescription>
            </div>
            <Button onClick={() => setShowDeposito(true)} variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Depósito
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => refetchDepositos()} disabled={fetchingDepositos} variant="outline" className="gap-1.5">
            {fetchingDepositos ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Carregar Depósitos
          </Button>
          {depositos.length === 0 && !fetchingDepositos && (
            <EmptyState icon={MapPin} title="Nenhum depósito" description="Carregue os depósitos do Bling" />
          )}
          {depositos.length > 0 && (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Descrição</TableHead><TableHead>Situação</TableHead><TableHead>Padrão</TableHead></TableRow></TableHeader>
                <TableBody>
                  {depositos.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.descricao}</TableCell>
                      <TableCell><Badge variant={d.situacao === 'A' || d.situacao === 1 ? 'default' : 'secondary'}>{d.situacao === 'A' || d.situacao === 1 ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                      <TableCell>{d.padrao ? 'Sim' : 'Não'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showLancar} onOpenChange={setShowLancar}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lançar Movimentação de Estoque</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>ID do Produto</Label><Input value={lancForm.idProduto} onChange={e => setLancForm(p => ({ ...p, idProduto: e.target.value }))} placeholder="Ex: 12345" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quantidade</Label><Input type="number" value={lancForm.quantidade} onChange={e => setLancForm(p => ({ ...p, quantidade: e.target.value }))} /></div>
              <div>
                <Label>Operação</Label>
                <Select value={lancForm.operacao} onValueChange={v => setLancForm(p => ({ ...p, operacao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="E">Entrada</SelectItem>
                    <SelectItem value="S">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>ID do Depósito (opcional)</Label><Input value={lancForm.idDeposito} onChange={e => setLancForm(p => ({ ...p, idDeposito: e.target.value }))} /></div>
            <div><Label>Observações</Label><Textarea value={lancForm.observacoes} onChange={e => setLancForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLancar(false)}>Cancelar</Button>
            <Button onClick={() => {
              lancarEstoque.mutate({
                idProduto: Number(lancForm.idProduto),
                quantidade: Number(lancForm.quantidade),
                idDeposito: lancForm.idDeposito ? Number(lancForm.idDeposito) : undefined,
                operacao: lancForm.operacao as 'E' | 'S',
                observacoes: lancForm.observacoes || undefined,
              }, { onSuccess: () => { setShowLancar(false); refetch(); } });
            }} disabled={!lancForm.idProduto || !lancForm.quantidade || lancarEstoque.isPending}>
              {lancarEstoque.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Lançar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeposito} onOpenChange={setShowDeposito}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Depósito</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Input value={depForm.descricao} onChange={e => setDepForm(p => ({ ...p, descricao: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeposito(false)}>Cancelar</Button>
            <Button onClick={() => {
              criarDeposito.mutate({ descricao: depForm.descricao, situacao: 'A' }, {
                onSuccess: () => { setShowDeposito(false); refetchDepositos(); }
              });
            }} disabled={!depForm.descricao || criarDeposito.isPending}>
              {criarDeposito.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
