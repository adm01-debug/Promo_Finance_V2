// PÁGINA: ASAAS - Cobranças & Pagamentos (Full)

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AntecipacaoDialog } from '@/components/asaas/AntecipacaoDialog';
import { TransferenciaPixHistoryPanel } from '@/components/asaas/TransferenciaPixHistoryPanel';
import { BoletoPreviewPanel } from '@/components/boletos/BoletoPreviewPanel';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard, Plus, RefreshCw,
  DollarSign, Clock, CheckCircle2, AlertTriangle,
  Send, Users, Loader2, TrendingUp, Target,
} from 'lucide-react';
import { useAsaas, type AsaasPayment } from '@/hooks/useAsaas';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { supabase } from '@/integrations/supabase/client';
import { NovaCobrancaDialog } from '@/components/asaas/NovaCobrancaDialog';
import { TransferenciaPixDialog } from '@/components/asaas/TransferenciaPixDialog';
import { PixQrCodeDialog } from '@/components/asaas/PixQrCodeDialog';
import { ClientesAsaasDialog } from '@/components/asaas/ClientesAsaasDialog';
import { AssinaturaDialog } from '@/components/asaas/AssinaturaDialog';
import { EstornoDialog } from '@/components/asaas/EstornoDialog';
import { SegundaViaDialog } from '@/components/asaas/SegundaViaDialog';
import { LinkPagamentoDialog } from '@/components/asaas/LinkPagamentoDialog';
import { ExtratoAsaasPanel } from '@/components/asaas/ExtratoAsaasPanel';
import { WebhooksLogPanel } from '@/components/asaas/WebhooksLogPanel';
import { AssinaturasListPanel } from '@/components/asaas/AssinaturasListPanel';
import { LinksListPanel } from '@/components/asaas/LinksListPanel';
import { CobrancasTab } from '@/components/asaas/tabs/CobrancasTab';
import { ConfigTab } from '@/components/asaas/tabs/ConfigTab';
import { FilaTab } from '@/components/asaas/tabs/FilaTab';
import { statusConfig } from '@/components/asaas/tabs/constants';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Asaas() {
  const { data: empresas, isLoading: loadingEmpresas } = useAllEmpresas();
  const empresaId = empresas?.[0]?.id;
  const {
    payments, loadingPayments, stats,
    cancelarCobranca, consultarSaldo,
    obterComprovante, auditTrail,
    detailStats,
    config, salvarConfig,
    syncQueue, loadingQueue, reprocessarManual,
    exportarAuditoria, exportarAuditoriaPDF, queueStats, simularBackoff,
  } = useAsaas(empresaId);

  // Reprocess dialog state (global — shared between Fila e Cobranças)
  const [reprocessDialog, setReprocessDialog] = useState<{ paymentId: string; asaasId: string } | null>(null);
  const [reprocessReason, setReprocessReason] = useState('');

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
  const [selectedPaymentAudit, setSelectedPaymentAudit] = useState<string | null>(null);
  const [selectedBoletoPreview, setSelectedBoletoPreview] = useState<AsaasPayment | null>(null);
  const [selectedAnticipationId, setSelectedAnticipationId] = useState<string | null>(null);
  const [selectedQueueHistory, setSelectedQueueHistory] = useState<Record<string, unknown>[] | null>(null);

  const [saldo, setSaldo] = useState<{ balance: number; totalPending: number } | null>(null);
  const [loadingSaldo, setLoadingSaldo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConsultarSaldo = async () => {
    setLoadingSaldo(true);
    try {
      const result = await consultarSaldo.mutateAsync();
      setSaldo(result);
    } catch { /* handled */ } finally {
      setLoadingSaldo(false);
    }
  };

  const handleCancelar = async () => {
    if (!cancelConfirm) return;
    try { await cancelarCobranca.mutateAsync(cancelConfirm); } catch { /* handled */ }
    setCancelConfirm(null);
  };

  const handleDownloadComprovante = async (asaasId: string) => {
    try {
      const result = await obterComprovante.mutateAsync(asaasId);
      if (result?.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Comprovante ainda não disponível para esta cobrança');
      }
    } catch (e: unknown) {
      toast.error('Erro ao buscar comprovante: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleReprocessar = async () => {
    if (!reprocessDialog) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }
    try {
      await reprocessarManual.mutateAsync({
        paymentId: reprocessDialog.paymentId,
        reason: reprocessReason,
        userId: user.id,
      });
      setReprocessDialog(null);
      setReprocessReason('');
    } catch { /* handled */ }
  };

  if (loadingEmpresas) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
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
            <h1 className="text-2xl font-bold text-foreground">Asaas Pagamentos</h1>
            <p className="text-muted-foreground text-sm">Plataforma premium para gestão de recebíveis e liquidação PIX</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance de Cobrança
              </CardTitle>
              <CardDescription>Volume financeiro por status de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              {loadingPayments ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detailStats || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis
                      dataKey="status"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => statusConfig[v]?.label || v}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$ ${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      formatter={(v: number) => [formatCurrency(v), 'Volume']}
                      labelFormatter={(label) => `Status: ${statusConfig[label]?.label || label}`}
                    />
                    <Bar dataKey="total_value" radius={[4, 4, 0, 0]} barSize={40}>
                      {(detailStats || []).map((entry: Record<string, any>, index: number) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.status === 'RECEIVED' || entry.status === 'CONFIRMED' ? '#10b981' :
                            entry.status === 'OVERDUE' ? '#ef4444' :
                              entry.status === 'PENDING' ? '#f59e0b' : '#6b7280'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Target className="h-5 w-5 text-success" />
                Metas de Recebimento
              </CardTitle>
              <CardDescription>Conversão de títulos pendentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de Liquidez</span>
                  <span className="font-bold">
                    {stats.total > 0 ? ((stats.recebidos / stats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <Progress value={stats.total > 0 ? (stats.recebidos / stats.total) * 100 : 0} className="h-2 bg-muted" />
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumo Rápido</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-success/5 border border-success/10">
                    <p className="text-[10px] text-success font-bold uppercase">Liquidados</p>
                    <p className="text-lg font-bold">{stats.recebidos}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/10">
                    <p className="text-[10px] text-warning font-bold uppercase">Aguardando</p>
                    <p className="text-lg font-bold">{stats.pendentes}</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full text-xs h-8 border-dashed" onClick={() => setDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-2" /> Gerar Nova Cobrança
              </Button>
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
            <TabsTrigger value="transfers">Histórico Pix</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="fila">Retentativas</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="transfers">
            <TransferenciaPixHistoryPanel empresaId={empresaId} />
          </TabsContent>

          <TabsContent value="fila">
            <FilaTab
              syncQueue={syncQueue}
              loadingQueue={loadingQueue}
              queueStats={queueStats}
              simularBackoff={simularBackoff}
              exportarAuditoria={exportarAuditoria}
              exportarAuditoriaPDF={exportarAuditoriaPDF}
              reprocessarManualPending={reprocessarManual.isPending}
              onReprocess={setReprocessDialog}
              onViewHistory={setSelectedQueueHistory}
            />
          </TabsContent>

          <TabsContent value="config">
            <ConfigTab config={config} salvarConfig={salvarConfig} queueStats={queueStats} />
          </TabsContent>

          <TabsContent value="cobrancas">
            <CobrancasTab
              payments={payments}
              loadingPayments={loadingPayments}
              reprocessarManual={reprocessarManual}
              onNovaCobranca={() => setDialogOpen(true)}
              onOpenPixQr={setPixQrDialog}
              onOpenEstorno={setEstornoDialog}
              onOpenSegundaVia={setSegundaViaDialog}
              onOpenAudit={setSelectedPaymentAudit}
              onOpenBoletoPreview={setSelectedBoletoPreview}
              onOpenAnticipation={setSelectedAnticipationId}
              onOpenReprocess={setReprocessDialog}
              onCancel={setCancelConfirm}
              onDownloadComprovante={handleDownloadComprovante}
            />
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

          <TabsContent value="webhooks">
            <WebhooksLogPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <NovaCobrancaDialog open={dialogOpen} onOpenChange={setDialogOpen} empresaId={empresaId} />
      <TransferenciaPixDialog open={pixTransferOpen} onOpenChange={setPixTransferOpen} empresaId={empresaId} />
      <ClientesAsaasDialog open={clientesOpen} onOpenChange={setClientesOpen} empresaId={empresaId} />
      <AssinaturaDialog open={assinaturaOpen} onOpenChange={(v) => { setAssinaturaOpen(v); if (!v) setRefreshKey(k => k + 1); }} empresaId={empresaId} />
      <LinkPagamentoDialog open={linkPagamentoOpen} onOpenChange={(v) => { setLinkPagamentoOpen(v); if (!v) setRefreshKey(k => k + 1); }} empresaId={empresaId} />

      {/* Dialog de Auditoria */}
      <ConfirmationDialog
        isOpen={!!selectedPaymentAudit}
        onClose={() => setSelectedPaymentAudit(null)}
        title="Trilha de Auditoria"
        message={
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {auditTrail
              .filter(a => a.payment_id === selectedPaymentAudit)
              .map((log: Record<string, any>) => (
                <div key={log.id} className="border-b pb-2 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(log.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs">{log.details?.message || 'Evento registrado no sistema.'}</p>
                  {log.previous_status && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Status: {log.previous_status} → {log.new_status}
                    </p>
                  )}
                </div>
              ))}
            {auditTrail.filter(a => a.payment_id === selectedPaymentAudit).length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">Nenhum evento registrado ainda.</p>
            )}
          </div>
        }
        confirmText="Fechar"
        onConfirm={() => setSelectedPaymentAudit(null)}
      />

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
      <ConfirmationDialog
        isOpen={!!reprocessDialog}
        onClose={() => setReprocessDialog(null)}
        title="Reprocessar Sincronização"
        message={
          <div className="space-y-4">
            <p>Você está forçando a sincronização manual do pagamento <strong>#{reprocessDialog?.asaasId}</strong>.</p>
            <div className="space-y-2">
              <Label>Motivo do Reprocessamento</Label>
              <Input
                placeholder="Ex: Falha na conciliação, atualização pendente..."
                value={reprocessReason}
                onChange={(e) => setReprocessReason(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Esta ação e o motivo serão registrados na trilha de auditoria.</p>
          </div>
        }
        confirmText="Confirmar e Sincronizar"
        onConfirm={handleReprocessar}
        isLoading={reprocessarManual.isPending}
      />

      {/* Dialog de Visualização de Boleto */}
      <Dialog open={!!selectedBoletoPreview} onOpenChange={(v) => !v && setSelectedBoletoPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização da Cobrança</DialogTitle>
          </DialogHeader>
          {selectedBoletoPreview && (
            <BoletoPreviewPanel
              boleto={{
                ...selectedBoletoPreview,
                sacado_nome: selectedBoletoPreview.sacado_nome || 'Cliente',
                sacado_cpf_cnpj: null,
                numero: selectedBoletoPreview.nosso_numero || selectedBoletoPreview.asaas_id,
                banco: 'Asaas',
                agencia: '0001',
                conta: '123456-7',
                cedente_nome: empresas?.[0]?.razao_social || 'Sua Empresa',
                cedente_cnpj: empresas?.[0]?.cnpj || null,
                vencimento: selectedBoletoPreview.data_vencimento,
              }}
              onUpdateStatus={({ status }) => {
                setSelectedBoletoPreview(null);
                toast.success(`Status atualizado para ${status}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Antecipação */}
      <AntecipacaoDialog
        paymentId={selectedAnticipationId}
        onClose={() => setSelectedAnticipationId(null)}
        empresaId={empresaId}
      />

      {/* Dialog de Logs da Fila */}
      <ConfirmationDialog
        isOpen={!!selectedQueueHistory}
        onClose={() => setSelectedQueueHistory(null)}
        title="Histórico de Falhas (Fila)"
        message={
          <div className="space-y-4 max-h-[350px] overflow-y-auto">
            {selectedQueueHistory?.map((log: Record<string, unknown>, i: number) => (
              <div key={i} className="p-3 bg-muted/20 rounded-md border text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span>Tentativa #{String(log.attempt)}</span>
                  <span className="text-muted-foreground">{format(parseISO(String(log.timestamp)), 'dd/MM HH:mm', { locale: ptBR })}</span>
                </div>
                <p className="text-destructive font-mono">{String(log.message)}</p>
              </div>
            ))}
          </div>
        }
        confirmText="Entendido"
        onConfirm={() => setSelectedQueueHistory(null)}
      />
    </MainLayout>
  );
}
