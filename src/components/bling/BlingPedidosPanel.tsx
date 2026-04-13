import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ShoppingCart, RefreshCw, CheckCircle2, XCircle, Loader2, FileText, Warehouse, DollarSign, RotateCcw, Receipt, ArrowUpDown, Trash2, MoreHorizontal } from 'lucide-react';
import { useBlingPedidos, useBlingPedidoMutations } from '@/hooks/useBling';
import { PaginationControls } from './BlingShared';

export function BlingPedidosPanel() {
  const [pagina, setPagina] = useState(1);
  const { data, refetch, isFetching } = useBlingPedidos({ pagina });
  const { alterarSituacao, gerarNFe, gerarNFCe, lancarEstoque, estornarEstoque, lancarContas, estornarContas, excluirPedidos } = useBlingPedidoMutations();
  const pedidos = data?.data || [];

  const situacaoMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    6: { label: 'Em aberto', variant: 'outline' },
    9: { label: 'Atendido', variant: 'default' },
    12: { label: 'Cancelado', variant: 'destructive' },
    15: { label: 'Em andamento', variant: 'secondary' },
    18: { label: 'Venda Agenciada', variant: 'outline' },
    21: { label: 'Em digitação', variant: 'outline' },
    24: { label: 'Verificado', variant: 'default' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Pedidos de Venda</CardTitle>
        <CardDescription>Listar, alterar situação, gerar NF-e/NFC-e, lançar/estornar estoque e contas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => { setPagina(1); refetch(); }} disabled={isFetching} className="gap-1.5">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Carregar Pedidos
        </Button>
        {pedidos.length === 0 && !isFetching && (
          <EmptyState icon={ShoppingCart} title="Nenhum pedido" description="Clique para carregar os pedidos do Bling" />
        )}
        {pedidos.length > 0 && (
          <>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-10">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((p: any) => {
                    const sit = situacaoMap[p.situacao?.id] || { label: `#${p.situacao?.id}`, variant: 'outline' as const };
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.numero || p.id}</TableCell>
                        <TableCell>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell>{p.contato?.nome || '-'}</TableCell>
                        <TableCell className="text-right">R$ {Number(p.totalProdutos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell><Badge variant={sit.variant}>{sit.label}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => alterarSituacao.mutate({ id: String(p.id), idSituacao: 9 })}>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar Atendido
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => alterarSituacao.mutate({ id: String(p.id), idSituacao: 15 })}>
                                <ArrowUpDown className="h-4 w-4 mr-2" /> Em Andamento
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => gerarNFe.mutate(String(p.id))}>
                                <FileText className="h-4 w-4 mr-2" /> Gerar NF-e
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => gerarNFCe.mutate(String(p.id))}>
                                <Receipt className="h-4 w-4 mr-2" /> Gerar NFC-e
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => lancarEstoque.mutate(String(p.id))}>
                                <Warehouse className="h-4 w-4 mr-2" /> Lançar Estoque
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => estornarEstoque.mutate(String(p.id))}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Estornar Estoque
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => lancarContas.mutate(String(p.id))}>
                                <DollarSign className="h-4 w-4 mr-2" /> Lançar Contas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => estornarContas.mutate(String(p.id))}>
                                <RotateCcw className="h-4 w-4 mr-2" /> Estornar Contas
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => alterarSituacao.mutate({ id: String(p.id), idSituacao: 12 })} className="text-destructive">
                                <XCircle className="h-4 w-4 mr-2" /> Cancelar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { if (confirm('Excluir pedido?')) excluirPedidos.mutate([String(p.id)]); }} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <PaginationControls pagina={pagina} setPagina={setPagina} hasMore={pedidos.length === 100} onRefetch={refetch} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
