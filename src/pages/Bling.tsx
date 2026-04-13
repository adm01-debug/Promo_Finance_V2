// @ts-nocheck
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ShoppingCart, Users, DollarSign, FileText, Warehouse, Link2, RefreshCw, CheckCircle2, XCircle, Truck } from 'lucide-react';
import { useBlingOAuth, useBlingStatus } from '@/hooks/useBling';
import { BlingContatosPanel } from '@/components/bling/BlingContatosPanel';
import { BlingPedidosPanel } from '@/components/bling/BlingPedidosPanel';
import { BlingProdutosPanel } from '@/components/bling/BlingProdutosPanel';
import { BlingEstoquePanel } from '@/components/bling/BlingEstoquePanel';
import { BlingFinanceiroPanel } from '@/components/bling/BlingFinanceiroPanel';
import { BlingNFeTab } from '@/components/bling/BlingNFeTab';
import { BlingLogisticaPanel } from '@/components/bling/BlingLogisticaPanel';
import { BlingWebhooksPanel } from '@/components/bling/BlingWebhooksPanel';

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
            <TabsContent value="nfe"><BlingNFeTab /></TabsContent>
            <TabsContent value="logistica"><BlingLogisticaPanel /></TabsContent>
            <TabsContent value="webhooks"><BlingWebhooksPanel /></TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
