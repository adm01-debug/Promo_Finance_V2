import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DollarSign, Tag, Receipt, CreditCard, RefreshCw, CheckCircle2, RotateCcw, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import {
  useBlingFinanceiro, useBlingFinanceiroMutations,
  useBlingFormasPagamento, useBlingContasContabeis, useBlingCategoriasFinanceiras, useBlingBorderos
} from '@/hooks/useBling';
import { PaginationControls, LoadingSkeleton } from './BlingShared';

export function BlingFinanceiroPanel() {
  const [tipo, setTipo] = useState<'receber' | 'pagar'>('receber');
  const [subTab, setSubTab] = useState<'contas' | 'formas' | 'portadores' | 'categorias' | 'borderos'>('contas');
  const [pagina, setPagina] = useState(1);
  const [showBaixa, setShowBaixa] = useState<{ id: string; tipo: 'receber' | 'pagar' } | null>(null);
  const { data, refetch, isFetching } = useBlingFinanceiro(tipo, { pagina });
  const {
    excluirContaReceber, excluirContaPagar,
    darBaixaReceber, darBaixaPagar,
    estornarBaixaReceber, estornarBaixaPagar,
  } = useBlingFinanceiroMutations();
  const { data: formasData, refetch: refetchFormas, isFetching: fetchingFormas } = useBlingFormasPagamento();
  const { data: portadoresData, refetch: refetchPortadores, isFetching: fetchingPortadores } = useBlingContasContabeis();
  const { data: categoriasData, refetch: refetchCategorias, isFetching: fetchingCategorias } = useBlingCategoriasFinanceiras();
  const { data: borderosData, refetch: refetchBorderos, isFetching: fetchingBorderos } = useBlingBorderos();
  const contas = data?.data || [];
  const formas = formasData?.data || [];
  const portadores = portadoresData?.data || [];
  const categorias = categoriasData?.data || [];
  const borderos = borderosData?.data || [];

  const [baixaForm, setBaixaForm] = useState({ valorRecebido: '', data: new Date().toISOString().split('T')[0] });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant={subTab === 'contas' ? 'default' : 'outline'} onClick={() => setSubTab('contas')} size="sm">
          <DollarSign className="h-4 w-4 mr-1" /> Contas
        </Button>
        <Button variant={subTab === 'formas' ? 'default' : 'outline'} onClick={() => { setSubTab('formas'); refetchFormas(); }} size="sm">
          <Tag className="h-4 w-4 mr-1" /> Formas de Pagamento
        </Button>
        <Button variant={subTab === 'portadores' ? 'default' : 'outline'} onClick={() => { setSubTab('portadores'); refetchPortadores(); }} size="sm">
          <Receipt className="h-4 w-4 mr-1" /> Portadores
        </Button>
        <Button variant={subTab === 'categorias' ? 'default' : 'outline'} onClick={() => { setSubTab('categorias'); refetchCategorias(); }} size="sm">
          <Tag className="h-4 w-4 mr-1" /> Categorias
        </Button>
        <Button variant={subTab === 'borderos' ? 'default' : 'outline'} onClick={() => { setSubTab('borderos'); refetchBorderos(); }} size="sm">
          <CreditCard className="h-4 w-4 mr-1" /> Borderôs
        </Button>
      </div>

      {subTab === 'contas' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Financeiro</CardTitle>
            <CardDescription>Contas a receber e a pagar — baixa, estorno, exclusão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant={tipo === 'receber' ? 'default' : 'outline'} onClick={() => { setTipo('receber'); setPagina(1); }}>A Receber</Button>
              <Button variant={tipo === 'pagar' ? 'default' : 'outline'} onClick={() => { setTipo('pagar'); setPagina(1); }}>A Pagar</Button>
              <Button onClick={() => { setPagina(1); refetch(); }} disabled={isFetching} variant="outline" className="gap-1.5">
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Carregar
              </Button>
            </div>
            {contas.length === 0 && !isFetching && (
              <EmptyState icon={DollarSign} title={`Nenhuma conta a ${tipo}`} description="Carregue as contas financeiras do Bling" />
            )}
            {contas.length > 0 && (
              <>
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead className="w-10">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contas.map((c: any) => {
                        const sitLabel = c.situacao === 1 ? 'Em aberto' : c.situacao === 2 ? (tipo === 'receber' ? 'Recebido' : 'Pago') : c.situacao === 3 ? 'Parcial' : c.situacao === 4 ? 'Vencido' : c.situacao === 5 ? 'Cancelado' : c.situacao === 6 ? 'Inadimplente' : `#${c.situacao}`;
                        const sitVariant = c.situacao === 1 ? 'outline' : c.situacao === 2 ? 'default' : c.situacao === 4 || c.situacao === 6 ? 'destructive' : 'secondary';
                        return (
                          <TableRow key={c.id}>
                            <TableCell>{c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                            <TableCell>{c.contato?.nome || '-'}</TableCell>
                            <TableCell>{c.historico || c.numeroDocumento || '-'}</TableCell>
                            <TableCell className="text-right font-semibold">R$ {Number(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell><Badge variant={sitVariant as any}>{sitLabel}</Badge></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {c.situacao !== 2 && (
                                    <DropdownMenuItem onClick={() => {
                                      setBaixaForm({ valorRecebido: String(c.valor || ''), data: new Date().toISOString().split('T')[0] });
                                      setShowBaixa({ id: String(c.id), tipo });
                                    }}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Dar Baixa
                                    </DropdownMenuItem>
                                  )}
                                  {c.situacao === 2 && (
                                    <DropdownMenuItem onClick={() => {
                                      if (confirm('Estornar a última baixa?')) {
                                        tipo === 'receber'
                                          ? estornarBaixaReceber.mutate({ id: String(c.id), baixaId: 'last' })
                                          : estornarBaixaPagar.mutate({ id: String(c.id), baixaId: 'last' });
                                      }
                                    }}>
                                      <RotateCcw className="h-4 w-4 mr-2" /> Estornar Baixa
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => {
                                    if (confirm('Excluir esta conta?')) {
                                      tipo === 'receber' ? excluirContaReceber.mutate(String(c.id)) : excluirContaPagar.mutate(String(c.id));
                                    }
                                  }}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls pagina={pagina} setPagina={setPagina} hasMore={contas.length === 100} onRefetch={refetch} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'formas' && (
        <Card>
          <CardHeader><CardTitle>Formas de Pagamento</CardTitle><CardDescription>Cadastros de formas de pagamento no Bling</CardDescription></CardHeader>
          <CardContent>
            {fetchingFormas ? <LoadingSkeleton /> : formas.length === 0 ? (
              <EmptyState icon={Tag} title="Nenhuma forma" description="Clique no botão acima para carregar" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {formas.map((f: any) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-xs">{f.id}</TableCell>
                        <TableCell className="font-medium">{f.descricao}</TableCell>
                        <TableCell><Badge variant="outline">{f.tipoPagamento || '-'}</Badge></TableCell>
                        <TableCell><Badge variant={f.situacao === 'A' || f.situacao === 1 ? 'default' : 'secondary'}>{f.situacao === 'A' || f.situacao === 1 ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'portadores' && (
        <Card>
          <CardHeader><CardTitle>Portadores (Contas Contábeis)</CardTitle><CardDescription>Bancos e portadores cadastrados no Bling</CardDescription></CardHeader>
          <CardContent>
            {fetchingPortadores ? <LoadingSkeleton /> : portadores.length === 0 ? (
              <EmptyState icon={Receipt} title="Nenhum portador" description="Clique no botão acima para carregar" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {portadores.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                        <TableCell className="font-medium">{p.descricao}</TableCell>
                        <TableCell><Badge variant="outline">{p.tipo || '-'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'categorias' && (
        <Card>
          <CardHeader><CardTitle>Categorias de Receitas e Despesas</CardTitle><CardDescription>Plano de contas financeiro do Bling</CardDescription></CardHeader>
          <CardContent>
            {fetchingCategorias ? <LoadingSkeleton /> : categorias.length === 0 ? (
              <EmptyState icon={Tag} title="Nenhuma categoria" description="Clique no botão acima para carregar" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {categorias.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                        <TableCell className="font-medium">{c.descricao}</TableCell>
                        <TableCell><Badge variant={c.tipo === 1 ? 'default' : 'destructive'}>{c.tipo === 1 ? 'Receita' : 'Despesa'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'borderos' && (
        <Card>
          <CardHeader><CardTitle>Borderôs</CardTitle><CardDescription>Borderôs financeiros do Bling</CardDescription></CardHeader>
          <CardContent>
            {fetchingBorderos ? <LoadingSkeleton /> : borderos.length === 0 ? (
              <EmptyState icon={CreditCard} title="Nenhum borderô" description="Clique no botão acima para carregar" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Data</TableHead><TableHead>Portador</TableHead><TableHead className="text-right">Valor Total</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {borderos.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.id}</TableCell>
                        <TableCell>{b.data ? new Date(b.data).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell>{b.portador?.descricao || '-'}</TableCell>
                        <TableCell className="text-right font-semibold">R$ {Number(b.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell><Badge variant="outline">{b.situacao || '-'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!showBaixa} onOpenChange={() => setShowBaixa(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar Baixa — Conta a {showBaixa?.tipo === 'receber' ? 'Receber' : 'Pagar'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Valor {showBaixa?.tipo === 'receber' ? 'Recebido' : 'Pago'} (R$)</Label><Input type="number" step="0.01" value={baixaForm.valorRecebido} onChange={e => setBaixaForm(p => ({ ...p, valorRecebido: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={baixaForm.data} onChange={e => setBaixaForm(p => ({ ...p, data: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBaixa(null)}>Cancelar</Button>
            <Button onClick={() => {
              if (!showBaixa) return;
              const payload = { valorRecebido: Number(baixaForm.valorRecebido), data: baixaForm.data };
              const mutation = showBaixa.tipo === 'receber' ? darBaixaReceber : darBaixaPagar;
              mutation.mutate({ id: showBaixa.id, data: payload }, {
                onSuccess: () => { setShowBaixa(null); refetch(); }
              });
            }} disabled={!baixaForm.valorRecebido || darBaixaReceber.isPending || darBaixaPagar.isPending}>
              {(darBaixaReceber.isPending || darBaixaPagar.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirmar Baixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
