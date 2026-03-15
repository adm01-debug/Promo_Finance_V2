// ============================================
// PÁGINA: ASAAS - Cobranças & Pagamentos (Full)
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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  CreditCard, QrCode, Banknote, Plus, RefreshCw, X,
  DollarSign, Clock, CheckCircle2, AlertTriangle, Copy, ExternalLink,
  Send, Users, Undo2, FileText, MoreHorizontal, Link2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAsaas } from '@/hooks/useAsaas';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { NovaCobrancaDialog } from '@/components/asaas/NovaCobrancaDialog';
import { TransferenciaPixDialog } from '@/components/asaas/TransferenciaPixDialog';
import { PixQrCodeDialog } from '@/components/asaas/PixQrCodeDialog';
import { ClientesAsaasDialog } from '@/components/asaas/ClientesAsaasDialog';
import { AssinaturaDialog } from '@/components/asaas/AssinaturaDialog';
import { EstornoDialog } from '@/components/asaas/EstornoDialog';
import { SegundaViaDialog } from '@/components/asaas/SegundaViaDialog';
import { LinkPagamentoDialog } from '@/components/asaas/LinkPagamentoDialog';
import { ExtratoAsaasPanel } from '@/components/asaas/ExtratoAsaasPanel';
import { AssinaturasListPanel } from '@/components/asaas/AssinaturasListPanel';
import { LinksListPanel } from '@/components/asaas/LinksListPanel';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
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
  boleto: Banknote, pix: QrCode, credit_card: CreditCard, debit_card: CreditCard,
};
const tipoLabels: Record<string, string> = {
  boleto: 'Boleto', pix: 'Pix', credit_card: 'Cartão', debit_card: 'Débito',
};

export default function Asaas() {
  const { data: empresas, isLoading: loadingEmpresas } = useAllEmpresas();
  const empresaId = empresas?.[0]?.id;
  const {
    payments, loadingPayments, stats,
    cancelarCobranca, consultarSaldo,
  } = useAsaas(empresaId);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pixTransferOpen, setPixTransferOpen] = useState(false);
  const [clientesOpen, setClientesOpen] = useState(false);
  const [assinaturaOpen, setAssinaturaOpen] = useState(false);
  const [linkPagamentoOpen, setLinkPagamentoOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  // Payment action dialogs
  const [pixQrDialog, setPixQrDialog] = useState<{ asaasId: string; pixCola?: string | null; pixQr?: string | null } | null>(null);
  const [estornoDialog, setEstornoDialog] = useState<{ asaasId: string; valor: number } | null>(null);
  const [segundaViaDialog, setSegundaViaDialog] = useState<string | null>(null);

  const [saldo, setSaldo] = useState<{ balance: number; totalPending: number } | null>(null);
  const [loadingSaldo, setLoadingSaldo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConsultarSaldo = async () => {
    setLoadingSaldo(true);
    try {
      const result = await consultarSaldo.mutateAsync();
      setSaldo(result);
    } catch { } finally {
      setLoadingSaldo(false);
    }
  };

  const handleCancelar = async () => {
    if (!cancelConfirm) return;
    try { await cancelarCobranca.mutateAsync(cancelConfirm); } catch { }
    setCancelConfirm(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const formatDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR }); } catch { return dateStr; }
  };

  if (loadingEmpresas) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!empresaId) {
    return (
      <MainLayout>
        <EmptyState icon={CreditCard} title="Nenhuma empresa cadastrada" description="Cadastre uma empresa antes de emitir cobranças ASAAS" />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cobranças ASAAS</h1>
            <p className="text-muted-foreground text-sm">Gerencie cobranças, transferências e assinaturas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleConsultarSaldo} disabled={loadingSaldo}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loadingSaldo ? 'animate-spin' : ''}`} />
              {saldo ? formatCurrency(saldo.balance) : 'Ver Saldo'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setClientesOpen(true)}>
              <Users className="h-4 w-4 mr-1" /> Clientes
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPixTransferOpen(true)}>
              <Send className="h-4 w-4 mr-1" /> Pix
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
                <span className="text-sm text-muted-foreground">Saldo Pendente</span>
              </div>
              <p className="text-2xl font-bold mt-1">{saldo ? formatCurrency(saldo.totalPending || 0) : '-'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="cobrancas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
            <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="extrato">Extrato</TabsTrigger>
          </TabsList>

          <TabsContent value="cobrancas">
            <Card>
              <CardHeader>
                <CardTitle>Cobranças</CardTitle>
                <CardDescription>Todas as cobranças emitidas via ASAAS</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : payments.length === 0 ? (
                  <EmptyState icon={CreditCard} title="Nenhuma cobrança" description="Crie sua primeira cobrança via Boleto ou Pix" action={{ label: 'Nova Cobrança', onClick: () => setDialogOpen(true) }} />
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
                          const isPaid = ['RECEIVED', 'CONFIRMED'].includes(payment.status);
                          const isPending = payment.status === 'PENDING';
                          const isOverdue = payment.status === 'OVERDUE';
                          const isBoleto = payment.tipo === 'boleto';
                          const isPix = payment.tipo === 'pix';

                          return (
                            <TableRow key={payment.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <TipoIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{tipoLabels[payment.tipo] || payment.tipo}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">{payment.descricao || '-'}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(payment.valor)}</TableCell>
                              <TableCell>{formatDate(payment.data_vencimento)}</TableCell>
                              <TableCell><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {payment.link_boleto && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Ver boleto">
                                      <a href={payment.link_boleto} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                                    </Button>
                                  )}
                                  {isPix && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver QR Code Pix"
                                      onClick={() => setPixQrDialog({ asaasId: payment.asaas_id, pixCola: payment.pix_copia_cola, pixQr: payment.pix_qrcode })}>
                                      <QrCode className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {payment.pix_copia_cola && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(payment.pix_copia_cola!)} title="Copiar Pix copia e cola">
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {payment.linha_digitavel && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(payment.linha_digitavel!)} title="Copiar linha digitável">
                                      <Banknote className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {isPending && (
                                      <DropdownMenuItem className="text-destructive" onClick={() => setCancelConfirm(payment.asaas_id)}>
                                        <X className="h-4 w-4 mr-2" /> Cancelar
                                      </DropdownMenuItem>
                                    )}
                                    {isPaid && (
                                      <DropdownMenuItem onClick={() => setEstornoDialog({ asaasId: payment.asaas_id, valor: payment.valor })}>
                                        <Undo2 className="h-4 w-4 mr-2" /> Estornar
                                      </DropdownMenuItem>
                                    )}
                                    {(isPending || isOverdue) && isBoleto && (
                                      <DropdownMenuItem onClick={() => setSegundaViaDialog(payment.asaas_id)}>
                                        <FileText className="h-4 w-4 mr-2" /> Segunda Via
                                      </DropdownMenuItem>
                                    )}
                                    {payment.link_fatura && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                          <a href={payment.link_fatura} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" /> Ver Fatura
                                          </a>
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
          </TabsContent>

          <TabsContent value="assinaturas" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setAssinaturaOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Nova Assinatura
              </Button>
            </div>
            <AssinaturasListPanel key={`subs-${refreshKey}`} empresaId={empresaId} />
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setLinkPagamentoOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Novo Link
              </Button>
            </div>
            <LinksListPanel key={`links-${refreshKey}`} empresaId={empresaId} />
          </TabsContent>

          <TabsContent value="extrato">
            <ExtratoAsaasPanel empresaId={empresaId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <NovaCobrancaDialog open={dialogOpen} onOpenChange={setDialogOpen} empresaId={empresaId} />
      <TransferenciaPixDialog open={pixTransferOpen} onOpenChange={setPixTransferOpen} empresaId={empresaId} />
      <ClientesAsaasDialog open={clientesOpen} onOpenChange={setClientesOpen} empresaId={empresaId} />
      <AssinaturaDialog open={assinaturaOpen} onOpenChange={setAssinaturaOpen} empresaId={empresaId} />
      <LinkPagamentoDialog open={linkPagamentoOpen} onOpenChange={setLinkPagamentoOpen} empresaId={empresaId} />

      {pixQrDialog && (
        <PixQrCodeDialog
          open={!!pixQrDialog}
          onOpenChange={(v) => !v && setPixQrDialog(null)}
          asaasId={pixQrDialog.asaasId}
          pixCopiaCola={pixQrDialog.pixCola}
          pixQrcode={pixQrDialog.pixQr}
          empresaId={empresaId}
        />
      )}

      {estornoDialog && (
        <EstornoDialog
          open={!!estornoDialog}
          onOpenChange={(v) => !v && setEstornoDialog(null)}
          asaasId={estornoDialog.asaasId}
          valorOriginal={estornoDialog.valor}
          empresaId={empresaId}
        />
      )}

      {segundaViaDialog && (
        <SegundaViaDialog
          open={!!segundaViaDialog}
          onOpenChange={(v) => !v && setSegundaViaDialog(null)}
          asaasId={segundaViaDialog}
          empresaId={empresaId}
        />
      )}

      <ConfirmationDialog
        isOpen={!!cancelConfirm}
        onClose={() => setCancelConfirm(null)}
        title="Cancelar Cobrança"
        message="Tem certeza que deseja cancelar esta cobrança? Esta ação não pode ser desfeita."
        type="danger"
        confirmText="Sim, Cancelar"
        onConfirm={handleCancelar}
        isLoading={cancelarCobranca.isPending}
      />
    </MainLayout>
  );
}
