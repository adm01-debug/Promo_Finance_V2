// @ts-nocheck
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Package, ShoppingCart, Users, DollarSign, FileText, Warehouse,
  Link2, RefreshCw, CheckCircle2, XCircle, Loader2,
  ExternalLink, Truck, Clock, AlertTriangle, Search, Eye,
  MoreHorizontal, Trash2, ArrowUpDown, Download, Send,
  RotateCcw, Receipt, Tag, MapPin, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  useBlingOAuth, useBlingStatus, useBlingContatos, useBlingContatoMutations,
  useBlingPedidos, useBlingPedidoMutations,
  useBlingProdutos, useBlingProdutoMutations,
  useBlingEstoque, useBlingDepositos, useBlingEstoqueMutations,
  useBlingFinanceiro, useBlingFinanceiroMutations,
  useBlingNFe, useBlingNFeMutations,
  useBlingLogisticas, useBlingRemessas, useBlingObjetos, useBlingLogisticaMutations,
  useBlingFormasPagamento, useBlingContasContabeis, useBlingCategoriasFinanceiras,
  useBlingWebhookEvents, useBlingSyncLogs
} from '@/hooks/useBling';

export default function Bling() {
  const [searchParams] = useSearchParams();
  const { getAuthUrl, exchangeCode } = useBlingOAuth();
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useBlingStatus();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      exchangeCode.mutate(code);
      window.history.replaceState({}, '', '/bling');
    }
  }, [searchParams]);

  const isConnected = status?.connected;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bling ERP</h1>
            <p className="text-muted-foreground">
              Integração completa com o Bling ERP v3 — Contatos, Pedidos, Produtos, Estoque, Financeiro, NF-e e Logística
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statusLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : isConnected ? (
              <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Conectado</Badge>
            ) : (
              <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Desconectado</Badge>
            )}
            {!isConnected && (
              <Button onClick={() => window.open(getAuthUrl(), '_self')} className="gap-2">
                <Link2 className="h-4 w-4" /> Conectar ao Bling
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => refetchStatus()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isConnected && status?.empresa && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-4 py-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">{status.empresa?.nome || 'Empresa Bling'}</p>
                <p className="text-sm text-muted-foreground">
                  CNPJ: {status.empresa?.cnpj || 'N/A'} — Token ativo e renovado automaticamente
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isConnected && !statusLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Conecte sua conta Bling</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Clique em "Conectar ao Bling" para autorizar o acesso via OAuth 2.0.
              </p>
              <Button onClick={() => window.open(getAuthUrl(), '_self')} size="lg" className="gap-2">
                <Link2 className="h-5 w-5" /> Iniciar Conexão OAuth
              </Button>
            </CardContent>
          </Card>
        )}

        {isConnected && (
          <Tabs defaultValue="contatos" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="contatos" className="gap-1.5"><Users className="h-4 w-4" /> Contatos</TabsTrigger>
              <TabsTrigger value="pedidos" className="gap-1.5"><ShoppingCart className="h-4 w-4" /> Pedidos</TabsTrigger>
              <TabsTrigger value="produtos" className="gap-1.5"><Package className="h-4 w-4" /> Produtos</TabsTrigger>
              <TabsTrigger value="estoque" className="gap-1.5"><Warehouse className="h-4 w-4" /> Estoque</TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-1.5"><DollarSign className="h-4 w-4" /> Financeiro</TabsTrigger>
              <TabsTrigger value="nfe" className="gap-1.5"><FileText className="h-4 w-4" /> NF-e</TabsTrigger>
              <TabsTrigger value="logistica" className="gap-1.5"><Truck className="h-4 w-4" /> Logística</TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-1.5"><RefreshCw className="h-4 w-4" /> Eventos</TabsTrigger>
            </TabsList>

            <TabsContent value="contatos"><BlingContatosPanel /></TabsContent>
            <TabsContent value="pedidos"><BlingPedidosPanel /></TabsContent>
            <TabsContent value="produtos"><BlingProdutosPanel /></TabsContent>
            <TabsContent value="estoque"><BlingEstoquePanel /></TabsContent>
            <TabsContent value="financeiro"><BlingFinanceiroPanel /></TabsContent>
            <TabsContent value="nfe"><BlingNFePanel /></TabsContent>
            <TabsContent value="logistica"><BlingLogisticaPanel /></TabsContent>
            <TabsContent value="webhooks"><BlingWebhooksPanel /></TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}

// ═══════════════ CONTATOS ═══════════════
function BlingContatosPanel() {
  const [pesquisa, setPesquisa] = useState('');
  const [criterio, setCriterio] = useState('1');
  const [pagina, setPagina] = useState(1);
  const { data, refetch, isFetching } = useBlingContatos({ pesquisa: pesquisa || undefined, criterio: Number(criterio), pagina });
  const { excluirContatos } = useBlingContatoMutations();
  const contatos = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Contatos do Bling</CardTitle>
        <CardDescription>Clientes, fornecedores e transportadoras — busca, filtro por tipo, exclusão em lote</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Buscar por nome, CPF/CNPJ..." value={pesquisa} onChange={e => setPesquisa(e.target.value)} className="max-w-sm" />
          <Select value={criterio} onValueChange={setCriterio}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Todos</SelectItem>
              <SelectItem value="2">Clientes</SelectItem>
              <SelectItem value="3">Fornecedores</SelectItem>
              <SelectItem value="4">Transportadoras</SelectItem>
              <SelectItem value="5">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setPagina(1); refetch(); }} disabled={isFetching} className="gap-1.5">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
          </Button>
        </div>
        {contatos.length === 0 && !isFetching && (
          <EmptyState icon={Users} title="Nenhum contato encontrado" description="Clique em Buscar para carregar os contatos do Bling" />
        )}
        {contatos.length > 0 && (
          <>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-10">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contatos.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id}</TableCell>
                      <TableCell className="font-medium">{c.nome || c.fantasia}</TableCell>
                      <TableCell>{c.numeroDocumento || '-'}</TableCell>
                      <TableCell>{c.email || '-'}</TableCell>
                      <TableCell>{c.telefone || c.celular || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.tipo === 'F' ? 'Física' : c.tipo === 'J' ? 'Jurídica' : c.tipo === 'E' ? 'Estrangeiro' : c.tipo || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.situacao === 'A' ? 'default' : 'secondary'}>{c.situacao === 'A' ? 'Ativo' : 'Inativo'}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              if (confirm(`Excluir contato #${c.id}?`)) excluirContatos.mutate([String(c.id)]);
                            }}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls pagina={pagina} setPagina={setPagina} hasMore={contatos.length === 100} onRefetch={refetch} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════ PEDIDOS ═══════════════
function BlingPedidosPanel() {
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

// ═══════════════ PRODUTOS ═══════════════
function BlingProdutosPanel() {
  const [nome, setNome] = useState('');
  const [pagina, setPagina] = useState(1);
  const { data, refetch, isFetching } = useBlingProdutos({ nome: nome || undefined, pagina });
  const { excluirProdutos } = useBlingProdutoMutations();
  const produtos = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Produtos</CardTitle>
        <CardDescription>Catálogo de produtos — busca, variações, kit/composição, exclusão em lote</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Buscar produto..." value={nome} onChange={e => setNome(e.target.value)} className="max-w-sm" />
          <Button onClick={() => { setPagina(1); refetch(); }} disabled={isFetching} className="gap-1.5">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
          </Button>
        </div>
        {produtos.length === 0 && !isFetching && (
          <EmptyState icon={Package} title="Nenhum produto" description="Busque produtos do Bling pelo nome ou código" />
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
  );
}

// ═══════════════ ESTOQUE ═══════════════
function BlingEstoquePanel() {
  const { data, refetch, isFetching } = useBlingEstoque();
  const { data: depositosData, refetch: refetchDepositos, isFetching: fetchingDepositos } = useBlingDepositos();
  const saldos = data?.data || [];
  const depositos = depositosData?.data || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5" /> Saldos de Estoque</CardTitle>
          <CardDescription>Saldos físico e virtual por produto nos depósitos do Bling</CardDescription>
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
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Depósitos</CardTitle>
          <CardDescription>Armazéns cadastrados no Bling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => refetchDepositos()} disabled={fetchingDepositos} variant="outline" className="gap-1.5">
            {fetchingDepositos ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Carregar Depósitos
          </Button>
          {depositos.length > 0 && (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Padrão</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depositos.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.descricao}</TableCell>
                      <TableCell>{d.padrao ? <Badge variant="default">Sim</Badge> : <Badge variant="outline">Não</Badge>}</TableCell>
                      <TableCell><Badge variant={d.situacao === 'A' ? 'default' : 'secondary'}>{d.situacao === 'A' ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════ FINANCEIRO ═══════════════
function BlingFinanceiroPanel() {
  const [tipo, setTipo] = useState<'receber' | 'pagar'>('receber');
  const [subTab, setSubTab] = useState<'contas' | 'formas' | 'portadores' | 'categorias'>('contas');
  const [pagina, setPagina] = useState(1);
  const { data, refetch, isFetching } = useBlingFinanceiro(tipo, { pagina });
  const { excluirContaReceber, excluirContaPagar } = useBlingFinanceiroMutations();
  const { data: formasData, refetch: refetchFormas, isFetching: fetchingFormas } = useBlingFormasPagamento();
  const { data: portadoresData, refetch: refetchPortadores, isFetching: fetchingPortadores } = useBlingContasContabeis();
  const { data: categoriasData, refetch: refetchCategorias, isFetching: fetchingCategorias } = useBlingCategoriasFinanceiras();
  const contas = data?.data || [];
  const formas = formasData?.data || [];
  const portadores = portadoresData?.data || [];
  const categorias = categoriasData?.data || [];

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
          <CardHeader>
            <CardTitle>Formas de Pagamento</CardTitle>
            <CardDescription>Cadastros de formas de pagamento no Bling</CardDescription>
          </CardHeader>
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
          <CardHeader>
            <CardTitle>Portadores (Contas Contábeis)</CardTitle>
            <CardDescription>Bancos e portadores cadastrados no Bling</CardDescription>
          </CardHeader>
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
          <CardHeader>
            <CardTitle>Categorias de Receitas e Despesas</CardTitle>
            <CardDescription>Plano de contas financeiro do Bling</CardDescription>
          </CardHeader>
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
    </div>
  );
}

// ═══════════════ NF-e ═══════════════
function BlingNFePanel() {
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

// ═══════════════ LOGÍSTICA ═══════════════
function BlingLogisticaPanel() {
  const [subTab, setSubTab] = useState<'integracoes' | 'remessas' | 'objetos'>('integracoes');
  const { data: logisticasData, refetch: refetchLogisticas, isFetching: fetchingLogisticas } = useBlingLogisticas();
  const { data: remessasData, refetch: refetchRemessas, isFetching: fetchingRemessas } = useBlingRemessas();
  const { data: objetosData, refetch: refetchObjetos, isFetching: fetchingObjetos } = useBlingObjetos();
  const logisticas = logisticasData?.data || [];
  const remessas = remessasData?.data || [];
  const objetos = objetosData?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={subTab === 'integracoes' ? 'default' : 'outline'} onClick={() => { setSubTab('integracoes'); refetchLogisticas(); }} size="sm">
          <Truck className="h-4 w-4 mr-1" /> Integrações
        </Button>
        <Button variant={subTab === 'remessas' ? 'default' : 'outline'} onClick={() => { setSubTab('remessas'); refetchRemessas(); }} size="sm">
          <Package className="h-4 w-4 mr-1" /> Remessas
        </Button>
        <Button variant={subTab === 'objetos' ? 'default' : 'outline'} onClick={() => { setSubTab('objetos'); refetchObjetos(); }} size="sm">
          <MapPin className="h-4 w-4 mr-1" /> Objetos/Rastreamento
        </Button>
      </div>

      {subTab === 'integracoes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Integrações Logísticas</CardTitle>
            <CardDescription>Transportadoras configuradas no Bling (ex: Loggi, Melhor Envio)</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingLogisticas ? <LoadingSkeleton /> : logisticas.length === 0 ? (
              <EmptyState icon={Truck} title="Nenhuma integração" description="Clique para carregar as integrações logísticas" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Transportadora</TableHead><TableHead>Situação</TableHead><TableHead>Serviços</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {logisticas.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs">{l.id}</TableCell>
                        <TableCell className="font-medium">{l.descricao || l.nome || '-'}</TableCell>
                        <TableCell><Badge variant={l.situacao === 'H' ? 'default' : 'secondary'}>{l.situacao === 'H' ? 'Habilitada' : 'Desabilitada'}</Badge></TableCell>
                        <TableCell>{l.servicos?.length || 0} serviço(s)</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'remessas' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Remessas de Envio</CardTitle>
            <CardDescription>Remessas criadas para envio via transportadoras</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingRemessas ? <LoadingSkeleton /> : remessas.length === 0 ? (
              <EmptyState icon={Package} title="Nenhuma remessa" description="Clique para carregar as remessas" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Data</TableHead><TableHead>Transportadora</TableHead><TableHead>Status</TableHead><TableHead>Rastreio</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {remessas.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell>{r.dataCriacao ? new Date(r.dataCriacao).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell>{r.logistica?.descricao || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{r.situacao || '-'}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{r.codigoRastreamento || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'objetos' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Objetos / Volumes</CardTitle>
            <CardDescription>Objetos e volumes enviados — rastreamento em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchingObjetos ? <LoadingSkeleton /> : objetos.length === 0 ? (
              <EmptyState icon={MapPin} title="Nenhum objeto" description="Clique para carregar os objetos de envio" />
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Remessa</TableHead><TableHead>Status</TableHead><TableHead>Última Atualização</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {objetos.map((o: any) => (
                      <TableRow key={o.id || o.codigo}>
                        <TableCell className="font-mono">{o.codigo || o.id}</TableCell>
                        <TableCell>{o.remessa?.id || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{o.situacao || o.status || '-'}</Badge></TableCell>
                        <TableCell>{o.ultimaAtualizacao ? new Date(o.ultimaAtualizacao).toLocaleString('pt-BR') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════ WEBHOOKS ═══════════════
function BlingWebhooksPanel() {
  const { data: events, isLoading } = useBlingWebhookEvents();
  const { data: logs } = useBlingSyncLogs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Eventos Webhook</CardTitle>
          <CardDescription>Eventos recebidos do Bling em tempo real — Pedidos, NF-e, Financeiro, Estoque, Contatos, Produtos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingSkeleton /> : !events || events.length === 0 ? (
            <EmptyState icon={RefreshCw} title="Nenhum evento" description="Os eventos do Bling aparecerão aqui quando configurados" />
          ) : (
            <div className="rounded-md border overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>ID Recurso</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(events as any[]).map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{new Date(e.received_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell><Badge variant="outline">{e.module}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{e.event_type}</TableCell>
                      <TableCell className="font-mono text-xs">{e.resource_id || '-'}</TableCell>
                      <TableCell>{e.retries || 0}</TableCell>
                      <TableCell>
                        {e.processed ? (
                          <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />OK</Badge>
                        ) : e.error_message ? (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Erro</Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {logs && (logs as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Logs de Sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Processados</TableHead>
                    <TableHead>Erros</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs as any[]).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{new Date(l.created_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{l.modulo}</TableCell>
                      <TableCell>{l.tipo}</TableCell>
                      <TableCell>{l.registros_processados}</TableCell>
                      <TableCell>{l.registros_com_erro}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === 'concluido' ? 'default' : l.status === 'erro' ? 'destructive' : 'secondary'}>{l.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════ HELPERS ═══════════════
function PaginationControls({ pagina, setPagina, hasMore, onRefetch }: { pagina: number; setPagina: (p: number) => void; hasMore: boolean; onRefetch: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">Página {pagina}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => { setPagina(pagina - 1); setTimeout(onRefetch, 50); }}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => { setPagina(pagina + 1); setTimeout(onRefetch, 50); }}>
          Próxima <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
}
