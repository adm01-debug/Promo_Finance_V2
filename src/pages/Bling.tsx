// @ts-nocheck
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package, ShoppingCart, Users, DollarSign, FileText, Warehouse,
  Link2, Settings, RefreshCw, CheckCircle2, XCircle, Loader2,
  ExternalLink, Truck, Clock, AlertTriangle, Search, Eye
} from 'lucide-react';
import { useBlingOAuth, useBlingStatus, useBlingContatos, useBlingPedidos, useBlingProdutos, useBlingEstoque, useBlingFinanceiro, useBlingNFe, useBlingWebhookEvents, useBlingSyncLogs } from '@/hooks/useBling';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function Bling() {
  const [searchParams] = useSearchParams();
  const { getAuthUrl, exchangeCode } = useBlingOAuth();
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useBlingStatus();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      exchangeCode.mutate(code);
      // Clean URL
      window.history.replaceState({}, '', '/bling');
    }
  }, [searchParams]);

  const isConnected = status?.connected;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bling ERP</h1>
            <p className="text-muted-foreground">
              Integração completa com o Bling ERP v3 — Contatos, Pedidos, Produtos, Estoque, Financeiro e NF-e
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statusLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : isConnected ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> Conectado
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" /> Desconectado
              </Badge>
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

        {/* Connection Card */}
        {isConnected && status?.empresa && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-4 py-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">{status.empresa?.nome || 'Empresa Bling'}</p>
                <p className="text-sm text-muted-foreground">
                  CNPJ: {status.empresa?.cnpj || 'N/A'} — Token ativo e atualizado automaticamente
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
                Seus dados serão sincronizados automaticamente.
              </p>
              <Button onClick={() => window.open(getAuthUrl(), '_self')} size="lg" className="gap-2">
                <Link2 className="h-5 w-5" /> Iniciar Conexão OAuth
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        {isConnected && (
          <Tabs defaultValue="contatos" className="space-y-4">
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="contatos" className="gap-1.5"><Users className="h-4 w-4" /> Contatos</TabsTrigger>
              <TabsTrigger value="pedidos" className="gap-1.5"><ShoppingCart className="h-4 w-4" /> Pedidos</TabsTrigger>
              <TabsTrigger value="produtos" className="gap-1.5"><Package className="h-4 w-4" /> Produtos</TabsTrigger>
              <TabsTrigger value="estoque" className="gap-1.5"><Warehouse className="h-4 w-4" /> Estoque</TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-1.5"><DollarSign className="h-4 w-4" /> Financeiro</TabsTrigger>
              <TabsTrigger value="nfe" className="gap-1.5"><FileText className="h-4 w-4" /> NF-e</TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-1.5"><Settings className="h-4 w-4" /> Eventos</TabsTrigger>
            </TabsList>

            <TabsContent value="contatos"><BlingContatosPanel /></TabsContent>
            <TabsContent value="pedidos"><BlingPedidosPanel /></TabsContent>
            <TabsContent value="produtos"><BlingProdutosPanel /></TabsContent>
            <TabsContent value="estoque"><BlingEstoquePanel /></TabsContent>
            <TabsContent value="financeiro"><BlingFinanceiroPanel /></TabsContent>
            <TabsContent value="nfe"><BlingNFePanel /></TabsContent>
            <TabsContent value="webhooks"><BlingWebhooksPanel /></TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}

// --- Contatos Panel ---
function BlingContatosPanel() {
  const [pesquisa, setPesquisa] = useState('');
  const { data, refetch, isFetching } = useBlingContatos({ pesquisa: pesquisa || undefined });
  const contatos = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Contatos do Bling</CardTitle>
        <CardDescription>Clientes, fornecedores e transportadoras cadastrados no Bling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Buscar por nome, CPF/CNPJ..." value={pesquisa} onChange={e => setPesquisa(e.target.value)} className="max-w-sm" />
          <Button onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </Button>
        </div>
        {contatos.length === 0 && !isFetching && (
          <EmptyState icon={Users} title="Nenhum contato encontrado" description="Clique em Buscar para carregar os contatos do Bling" />
        )}
        {contatos.length > 0 && (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Situação</TableHead>
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
                      <Badge variant={c.situacao === 'A' ? 'default' : 'secondary'}>
                        {c.situacao === 'A' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Pedidos Panel ---
function BlingPedidosPanel() {
  const { data, refetch, isFetching } = useBlingPedidos();
  const pedidos = data?.data || [];

  const situacaoMap: Record<number, { label: string; color: string }> = {
    6: { label: 'Em aberto', color: 'bg-yellow-100 text-yellow-800' },
    9: { label: 'Atendido', color: 'bg-green-100 text-green-800' },
    12: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600' },
    15: { label: 'Em andamento', color: 'bg-blue-100 text-blue-800' },
    21: { label: 'Em digitação', color: 'bg-pink-100 text-pink-800' },
    24: { label: 'Verificado', color: 'bg-emerald-100 text-emerald-800' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Pedidos de Venda</CardTitle>
        <CardDescription>Pedidos de venda registrados no Bling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Carregar Pedidos
        </Button>
        {pedidos.length === 0 && !isFetching && (
          <EmptyState icon={ShoppingCart} title="Nenhum pedido" description="Clique para carregar os pedidos do Bling" />
        )}
        {pedidos.length > 0 && (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((p: any) => {
                  const sit = situacaoMap[p.situacao?.id] || { label: `#${p.situacao?.id}`, color: 'bg-muted' };
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.numero || p.id}</TableCell>
                      <TableCell>{p.data ? new Date(p.data).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell>{p.contato?.nome || '-'}</TableCell>
                      <TableCell>R$ {Number(p.totalProdutos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sit.color}`}>{sit.label}</span></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Produtos Panel ---
function BlingProdutosPanel() {
  const [nome, setNome] = useState('');
  const { data, refetch, isFetching } = useBlingProdutos({ nome: nome || undefined });
  const produtos = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Produtos</CardTitle>
        <CardDescription>Catálogo de produtos do Bling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Buscar produto..." value={nome} onChange={e => setNome(e.target.value)} className="max-w-sm" />
          <Button onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </Button>
        </div>
        {produtos.length === 0 && !isFetching && (
          <EmptyState icon={Package} title="Nenhum produto" description="Busque produtos do Bling pelo nome ou código" />
        )}
        {produtos.length > 0 && (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.codigo || '-'}</TableCell>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>R$ {Number(p.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.tipo === 'P' ? 'Produto' : p.tipo === 'S' ? 'Serviço' : 'Kit'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.situacao === 'A' ? 'default' : 'secondary'}>
                        {p.situacao === 'A' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Estoque Panel ---
function BlingEstoquePanel() {
  const { data, refetch, isFetching } = useBlingEstoque();
  const saldos = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5" /> Saldos de Estoque</CardTitle>
        <CardDescription>Saldos físico e virtual por produto nos depósitos do Bling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Carregar Saldos
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
  );
}

// --- Financeiro Panel ---
function BlingFinanceiroPanel() {
  const [tipo, setTipo] = useState<'receber' | 'pagar'>('receber');
  const { data, refetch, isFetching } = useBlingFinanceiro(tipo);
  const contas = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Financeiro</CardTitle>
        <CardDescription>Contas a receber e a pagar do Bling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant={tipo === 'receber' ? 'default' : 'outline'} onClick={() => setTipo('receber')}>A Receber</Button>
          <Button variant={tipo === 'pagar' ? 'default' : 'outline'} onClick={() => setTipo('pagar')}>A Pagar</Button>
          <Button onClick={() => refetch()} disabled={isFetching} variant="outline" className="gap-1.5">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Carregar
          </Button>
        </div>
        {contas.length === 0 && !isFetching && (
          <EmptyState icon={DollarSign} title={`Nenhuma conta a ${tipo}`} description="Carregue as contas financeiras do Bling" />
        )}
        {contas.length > 0 && (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.vencimento ? new Date(c.vencimento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>{c.contato?.nome || '-'}</TableCell>
                    <TableCell>{c.historico || c.numeroDocumento || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {Number(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.situacao === 1 ? 'outline' : c.situacao === 2 ? 'default' : 'destructive'}>
                        {c.situacao === 1 ? 'Em aberto' : c.situacao === 2 ? 'Pago' : c.situacao === 4 ? 'Vencido' : `#${c.situacao}`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- NF-e Panel ---
function BlingNFePanel() {
  const { data, refetch, isFetching } = useBlingNFe();
  const notas = data?.data || [];

  const situacaoNFe: Record<number, string> = {
    1: 'Em digitação', 4: 'Validada', 6: 'Autorizada', 7: 'Cancelada', 9: 'Denegada'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Notas Fiscais (NF-e)</CardTitle>
        <CardDescription>Notas fiscais eletrônicas emitidas pelo Bling</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => refetch()} disabled={isFetching} className="gap-1.5">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Carregar NF-e
        </Button>
        {notas.length === 0 && !isFetching && (
          <EmptyState icon={FileText} title="Nenhuma NF-e" description="Carregue as notas fiscais do Bling" />
        )}
        {notas.length > 0 && (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notas.map((n: any) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono">{n.numero || '-'}</TableCell>
                    <TableCell>{n.dataEmissao ? new Date(n.dataEmissao).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>{n.contato?.nome || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {Number(n.valorNota || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={n.situacao === 6 ? 'default' : n.situacao === 7 ? 'destructive' : 'outline'}>
                        {situacaoNFe[n.situacao] || `#${n.situacao}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {n.linkDanfe && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={n.linkDanfe} target="_blank" rel="noreferrer"><Eye className="h-3 w-3" /></a>
                          </Button>
                        )}
                        {n.xml && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={n.xml} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Webhooks Panel ---
function BlingWebhooksPanel() {
  const { data: events, isLoading } = useBlingWebhookEvents();
  const { data: logs } = useBlingSyncLogs();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Eventos Webhook</CardTitle>
          <CardDescription>Eventos recebidos do Bling em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !events || events.length === 0 ? (
            <EmptyState icon={Settings} title="Nenhum evento" description="Os eventos do Bling aparecerão aqui quando configurados" />
          ) : (
            <div className="rounded-md border overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>ID Recurso</TableHead>
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
                        <Badge variant={l.status === 'concluido' ? 'default' : l.status === 'erro' ? 'destructive' : 'secondary'}>
                          {l.status}
                        </Badge>
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
