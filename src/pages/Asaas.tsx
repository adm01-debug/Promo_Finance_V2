// PÁGINA: ASAAS - Cobranças & Pagamentos (Full)
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AntecipacaoDialog } from '@/components/asaas/AntecipacaoDialog';
import { TransferenciaPixHistoryPanel } from '@/components/asaas/TransferenciaPixHistoryPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { CreditCard, Plus } from 'lucide-react';
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
import { toast } from 'sonner';
import {
  AsaasHeader,
  AsaasKpis,
  PerformanceChart,
  MetasCard,
  AuditTrailDialog,
  ReprocessDialog,
  BoletoPreviewDialog,
  QueueHistoryDialog,
} from './Asaas.parts';

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
        <AsaasHeader
          saldo={saldo}
          loadingSaldo={loadingSaldo}
          onConsultarSaldo={handleConsultarSaldo}
          onOpenClientes={() => setClientesOpen(true)}
          onOpenPix={() => setPixTransferOpen(true)}
          onNovaCobranca={() => setDialogOpen(true)}
        />

        <AsaasKpis stats={stats} saldo={saldo} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PerformanceChart loading={loadingPayments} detailStats={detailStats} />
          <MetasCard stats={stats} onNovaCobranca={() => setDialogOpen(true)} />
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

      <AuditTrailDialog
        isOpen={!!selectedPaymentAudit}
        onClose={() => setSelectedPaymentAudit(null)}
        paymentId={selectedPaymentAudit}
        logs={auditTrail}
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
      <ReprocessDialog
        isOpen={!!reprocessDialog}
        onClose={() => setReprocessDialog(null)}
        asaasId={reprocessDialog?.asaasId}
        reason={reprocessReason}
        onReasonChange={setReprocessReason}
        onConfirm={handleReprocessar}
        isLoading={reprocessarManual.isPending}
      />

      <BoletoPreviewDialog
        payment={selectedBoletoPreview}
        empresaNome={empresas?.[0]?.razao_social}
        empresaCnpj={empresas?.[0]?.cnpj}
        onClose={() => setSelectedBoletoPreview(null)}
      />

      {/* Dialog de Antecipação */}
      <AntecipacaoDialog
        paymentId={selectedAnticipationId}
        onClose={() => setSelectedAnticipationId(null)}
        empresaId={empresaId}
      />

      <QueueHistoryDialog
        isOpen={!!selectedQueueHistory}
        onClose={() => setSelectedQueueHistory(null)}
        logs={selectedQueueHistory}
      />
    </MainLayout>
  );
}
