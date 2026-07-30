import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FileText, RefreshCw, Loader2, Eye, Download, Send, Warehouse, DollarSign, RotateCcw, XCircle, MoreHorizontal } from 'lucide-react';
import { useBlingNFe, useBlingNFeMutations } from '@/hooks/useBling';
import { PaginationControls } from './BlingShared';

export function BlingNFeTab() {
  const [pagina, setPagina] = useState(1);
  const { data, refetch, isFetching } = useBlingNFe({ pagina });
  const { enviarSefaz, cancelarNFe, lancarEstoqueNFe, lancarContasNFe, estornarEstoqueNFe, estornarContasNFe } = useBlingNFeMutations();
  const notas = data?.data || [];

  const situacaoNFe: Record<number, string> = {
    1: 'Em digitação', 4: 'Validada', 6: 'Autorizada', 7: 'Cancelada', 9: 'Denegada'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Notas Fiscais (NF-e)</CardTitle>
        <CardDescription>Listar, enviar ao SEFAZ, lançar/estornar estoque e contas, cancelar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => { setPagina(1); refetch(); }} disabled={isFetching} className="gap-1.5">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Carregar NF-e
        </Button>
        {notas.length === 0 && !isFetching && (
          <EmptyState icon={FileText} title="Nenhuma NF-e" description="Carregue as notas fiscais do Bling" />
        )}
        {notas.length > 0 && (
          <>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-10">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notas.map((n: any) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono">{n.numero || '-'}</TableCell>
                      <TableCell>{n.dataEmissao ? new Date(n.dataEmissao).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell>{n.contato?.nome || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">R$ {Number(n.valorNota || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant={n.situacao === 6 ? 'default' : n.situacao === 7 ? 'destructive' : 'outline'}>
                          {situacaoNFe[n.situacao] || `#${n.situacao}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {n.linkDanfe && (
                              <DropdownMenuItem asChild>
                                <a href={n.linkDanfe} target="_blank" rel="noreferrer"><Eye className="h-4 w-4 mr-2" /> Ver DANFE</a>
                              </DropdownMenuItem>
                            )}
                            {n.xml && (
                              <DropdownMenuItem asChild>
                                <a href={n.xml} target="_blank" rel="noreferrer"><Download className="h-4 w-4 mr-2" /> Baixar XML</a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => enviarSefaz.mutate({ id: String(n.id), enviarEmail: true })}>
                              <Send className="h-4 w-4 mr-2" /> Enviar SEFAZ + Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => enviarSefaz.mutate({ id: String(n.id), enviarEmail: false })}>
                              <Send className="h-4 w-4 mr-2" /> Enviar SEFAZ
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => lancarEstoqueNFe.mutate(String(n.id))}>
                              <Warehouse className="h-4 w-4 mr-2" /> Lançar Estoque
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => estornarEstoqueNFe.mutate(String(n.id))}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Estornar Estoque
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => lancarContasNFe.mutate(String(n.id))}>
                              <DollarSign className="h-4 w-4 mr-2" /> Lançar Contas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => estornarContasNFe.mutate(String(n.id))}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Estornar Contas
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              if (confirm('Cancelar esta NF-e?')) cancelarNFe.mutate([String(n.id)]);
                            }}><XCircle className="h-4 w-4 mr-2" /> Cancelar NF-e</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls pagina={pagina} setPagina={setPagina} hasMore={notas.length === 100} onRefetch={refetch} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
