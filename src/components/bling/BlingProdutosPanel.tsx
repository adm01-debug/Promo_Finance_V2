import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Plus, Layers, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import { useBlingProdutos, useBlingProdutoMutations, useBlingVariacoes } from '@/hooks/useBling';
import { PaginationControls, LoadingSkeleton } from './BlingShared';

export function BlingProdutosPanel() {
  const [nome, setNome] = useState('');
  const [pagina, setPagina] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showVariacoes, setShowVariacoes] = useState<string | null>(null);
  const { data, refetch, isFetching } = useBlingProdutos({ nome: nome || undefined, pagina });
  const { criarProduto, excluirProdutos } = useBlingProdutoMutations();
  const { data: variacoesData, refetch: refetchVariacoes, isFetching: fetchingVariacoes } = useBlingVariacoes(showVariacoes || undefined);
  const produtos = data?.data || [];
  const variacoes = variacoesData?.data || [];

  const [prodForm, setProdForm] = useState({ nome: '', codigo: '', preco: '', tipo: 'P', formato: 'S', situacao: 'A' });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Produtos</CardTitle>
              <CardDescription>Catálogo — CRUD, variações, kit/composição, exclusão em lote</CardDescription>
            </div>
            <Button onClick={() => { setProdForm({ nome: '', codigo: '', preco: '', tipo: 'P', formato: 'S', situacao: 'A' }); setShowCreate(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Buscar produto..." value={nome} onChange={e => setNome(e.target.value)} className="max-w-sm" />
            <Button onClick={() => { setPagina(1); refetch(); }} disabled={isFetching} className="gap-1.5">
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
            </Button>
          </div>
          {produtos.length === 0 && !isFetching && (
            <EmptyState icon={Package} title="Nenhum produto" description="Busque ou crie produtos no Bling" />
          )}
          {produtos.length > 0 && (
            <>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Formato</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="w-10">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.codigo || '-'}</TableCell>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell className="text-right">R$ {Number(p.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.tipo === 'P' ? 'Produto' : p.tipo === 'S' ? 'Serviço' : p.tipo === 'E' ? 'Kit' : p.tipo || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.formato === 'S' ? 'Simples' : p.formato === 'V' ? 'Com Variação' : p.formato === 'E' ? 'Composição' : p.formato || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.situacao === 'A' ? 'default' : 'secondary'}>{p.situacao === 'A' ? 'Ativo' : 'Inativo'}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {p.formato === 'V' && (
                                <DropdownMenuItem onClick={() => { setShowVariacoes(String(p.id)); setTimeout(() => refetchVariacoes(), 100); }}>
                                  <Layers className="h-4 w-4 mr-2" /> Ver Variações
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => {
                                if (confirm(`Excluir produto #${p.id}?`)) excluirProdutos.mutate([String(p.id)]);
                              }}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls pagina={pagina} setPagina={setPagina} hasMore={produtos.length === 100} onRefetch={refetch} />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
            <DialogDescription>Cadastre um produto no Bling</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={prodForm.nome} onChange={e => setProdForm(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código (SKU)</Label><Input value={prodForm.codigo} onChange={e => setProdForm(p => ({ ...p, codigo: e.target.value }))} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={prodForm.preco} onChange={e => setProdForm(p => ({ ...p, preco: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={prodForm.tipo} onValueChange={v => setProdForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P">Produto</SelectItem>
                    <SelectItem value="S">Serviço</SelectItem>
                    <SelectItem value="E">Kit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Formato</Label>
                <Select value={prodForm.formato} onValueChange={v => setProdForm(p => ({ ...p, formato: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">Simples</SelectItem>
                    <SelectItem value="V">Com Variação</SelectItem>
                    <SelectItem value="E">Composição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={() => {
              criarProduto.mutate({ nome: prodForm.nome, codigo: prodForm.codigo, preco: Number(prodForm.preco) || 0, tipo: prodForm.tipo, formato: prodForm.formato, situacao: 'A' }, {
                onSuccess: () => { setShowCreate(false); refetch(); }
              });
            }} disabled={!prodForm.nome || criarProduto.isPending}>
              {criarProduto.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showVariacoes} onOpenChange={() => setShowVariacoes(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Variações do Produto #{showVariacoes}</DialogTitle>
          </DialogHeader>
          {fetchingVariacoes ? <LoadingSkeleton /> : variacoes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma variação encontrada.</p>
          ) : (
            <div className="rounded-md border overflow-auto max-h-80">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nome</TableHead><TableHead>Código</TableHead><TableHead className="text-right">Preço</TableHead></TableRow></TableHeader>
                <TableBody>
                  {variacoes.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.id}</TableCell>
                      <TableCell>{v.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{v.codigo || '-'}</TableCell>
                      <TableCell className="text-right">R$ {Number(v.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
