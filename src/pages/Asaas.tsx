// ============================================
// PÁGINA: ASAAS - Cobranças & Pagamentos
// ============================================

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  CreditCard, QrCode, Banknote, Plus, RefreshCw, X,
  DollarSign, Clock, CheckCircle2, AlertTriangle, Copy, ExternalLink,
} from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { NovaCobrancaDialog } from '@/components/asaas/NovaCobrancaDialog';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'secondary' },
  RECEIVED: { label: 'Recebido', variant: 'default' },
  CONFIRMED: { label: 'Confirmado', variant: 'default' },
  OVERDUE: { label: 'Vencido', variant: 'destructive' },
  CANCELLED: { label: 'Cancelado', variant: 'outline' },
  REFUNDED: { label: 'Estornado', variant: 'outline' },
  CHARGEBACK: { label: 'Chargeback', variant: 'destructive' },
};

const tipoIcons: Record<string, React.ElementType> = {
  boleto: Banknote,
  pix: QrCode,
  credit_card: CreditCard,
  debit_card: CreditCard,
};

export default function Asaas() {
  const { data: empresas } = useAllEmpresas();
  const empresaId = empresas?.[0]?.id;
  const {
    payments, loadingPayments, stats,
    cancelarCobranca, consultarSaldo,
  } = useAsaas(empresaId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saldo, setSaldo] = useState<{ balance: number; totalPending: number } | null>(null);
  const [loadingSaldo, setLoadingSaldo] = useState(false);

  const handleConsultarSaldo = async () => {
    setLoadingSaldo(true);
    try {
      const result = await consultarSaldo.mutateAsync();
      setSaldo(result);
    } catch {
      // error handled by hook
    } finally {
      setLoadingSaldo(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cobranças ASAAS</h1>
            <p className="text-muted-foreground text-sm">Emita cobranças reais por Boleto, Pix e Cartão</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleConsultarSaldo} disabled={loadingSaldo}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loadingSaldo ? 'animate-spin' : ''}`} />
              {saldo ? formatCurrency(saldo.balance) : 'Ver Saldo'}
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nova Cobrança
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Pendentes</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.pendentes}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(stats.valorPendente)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Recebidos</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.recebidos}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(stats.valorRecebido)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Vencidos</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.vencidos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Cobranças</CardTitle>
            <CardDescription>Todas as cobranças emitidas via ASAAS</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPayments ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="Nenhuma cobrança"
                description="Crie sua primeira cobrança via Boleto, Pix ou Cartão"
                action={{ label: 'Nova Cobrança', onClick: () => setDialogOpen(true) }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Links</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => {
                      const TipoIcon = tipoIcons[payment.tipo] || CreditCard;
                      const statusInfo = statusConfig[payment.status] || { label: payment.status, variant: 'outline' as const };
                      return (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TipoIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm capitalize">{payment.tipo === 'credit_card' ? 'Cartão' : payment.tipo}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{payment.descricao || '-'}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(payment.valor)}</TableCell>
                          <TableCell>
                            {format(new Date(payment.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {payment.link_boleto && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                  <a href={payment.link_boleto} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              )}
                              {payment.pix_copia_cola && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(payment.pix_copia_cola!)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {payment.linha_digitavel && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(payment.linha_digitavel!)}>
                                  <Banknote className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => cancelarCobranca.mutate(payment.asaas_id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NovaCobrancaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        empresaId={empresaId}
      />
    </MainLayout>
  );
}
