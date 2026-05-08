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
  Send, Users, Undo2, FileText, MoreHorizontal, Link2, Download, History,
  Settings as SettingsIcon, LayoutDashboard, FileSpreadsheet, PlayCircle,
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
import { WebhooksLogPanel } from '@/components/asaas/WebhooksLogPanel';
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
    obterComprovante, auditTrail, loadingAudit,
    // Novos do hook
    config, loadingConfig, salvarConfig,
    syncQueue, loadingQueue, reprocessarManual,
    exportarAuditoria, queueStats,
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
  const [selectedPaymentAudit, setSelectedPaymentAudit] = useState<string | null>(null);

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

  const handleDownloadComprovante = async (asaasId: string) => {
    try {
      const result = await obterComprovante.mutateAsync(asaasId);
      if (result?.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Comprovante ainda não disponível para esta cobrança');
      }
    } catch (e: any) {
      toast.error('Erro ao buscar comprovante: ' + e.message);
    }
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
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="fila">Retentativas</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          {/* NOVO: Dashboard de Retentativas */}
          <TabsContent value="fila">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Total na Fila</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-sm text-muted-foreground">Pendentes</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.pendentes}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">Falhas Críticas</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.falhas}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm text-muted-foreground">Sucesso</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{queueStats.sucesso}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Fila de Sincronização</CardTitle>
                    <CardDescription>Monitoramento de retentativas automáticas</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportarAuditoria()}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Auditoria
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pagamento ID</TableHead>
                        <TableHead>Tentativas</TableHead>
                        <TableHead>Próxima Retentativa</TableHead>
                        <TableHead>Último Erro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingQueue ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando fila...</TableCell></TableRow>
                      ) : syncQueue.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Fila vazia</TableCell></TableRow>
                      ) : syncQueue.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.payment_id.substring(0,8)}...</TableCell>
                          <TableCell>{item.attempts} / {item.max_attempts}</TableCell>
                          <TableCell>{item.next_retry_at ? formatDate(item.next_retry_at) : '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-destructive">{item.last_error || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'failed' ? 'destructive' : 'secondary'}>{item.status.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => reprocessarManual.mutate(item.payment_id)} disabled={reprocessarManual.isPending} title="Reprocessar Manual">
                              <PlayCircle className={`h-4 w-4 ${reprocessarManual.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NOVO: Configurações de Retentativa */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" /> Políticas de Retentativa
                </CardTitle>
                <CardDescription>Configure como o sistema deve lidar com falhas de comunicação com o Asaas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Limite de Tentativas</label>
                    <Input type="number" value={config?.retry_limit || 5} 
                      onChange={(e) => salvarConfig.mutate({ retry_limit: parseInt(e.target.value) })} />
                    <p className="text-xs text-muted-foreground">Número máximo de vezes que o sistema tentará sincronizar.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intervalo Inicial (minutos)</label>
                    <Input type="number" value={config?.retry_interval_minutes || 30} 
                      onChange={(e) => salvarConfig.mutate({ retry_interval_minutes: parseInt(e.target.value) })} />
                    <p className="text-xs text-muted-foreground">Tempo de espera antes da primeira retentativa.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Multiplicador Backoff</label>
                    <Input type="number" step="0.5" value={config?.backoff_multiplier || 2.0} 
                      onChange={(e) => salvarConfig.mutate({ backoff_multiplier: parseFloat(e.target.value) })} />
                    <p className="text-xs text-muted-foreground">Fator de aumento do intervalo entre tentativas (ex: 2.0 = dobra o tempo).</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                                    <DropdownMenuItem onClick={() => setSelectedPaymentAudit(payment.id)}>
                                      <History className="h-4 w-4 mr-2" /> Auditoria
                                    </DropdownMenuItem>
                                    {isPaid && (
                                      <DropdownMenuItem onClick={() => handleDownloadComprovante(payment.asaas_id)}>
                                        <Download className="h-4 w-4 mr-2" /> Comprovante
                                      </DropdownMenuItem>
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

          <TabsContent value="webhooks">
            <WebhooksLogPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <NovaCobrancaDialog open={dialogOpen} onOpenChange={setDialogOpen} empresaId={empresaId} />
      <TransferenciaPixDialog open={pixTransferOpen} onOpenChange={setPixTransferOpen} empresaId={empresaId} />
      <ClientesAsaasDialog open={clientesOpen} onOpenChange={setClientesOpen} empresaId={empresaId} />
      
      {/* Dialog de Auditoria */}
      <ConfirmationDialog
        isOpen={!!selectedPaymentAudit}
        onClose={() => setSelectedPaymentAudit(null)}
        title="Trilha de Auditoria"
        message={
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {auditTrail
              .filter(a => a.payment_id === selectedPaymentAudit)
              .map((log: any) => (
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
      <TransferenciaPixDialog open={pixTransferOpen} onOpenChange={setPixTransferOpen} empresaId={empresaId} />
      <ClientesAsaasDialog open={clientesOpen} onOpenChange={setClientesOpen} empresaId={empresaId} />
      <AssinaturaDialog open={assinaturaOpen} onOpenChange={(v) => { setAssinaturaOpen(v); if (!v) setRefreshKey(k => k + 1); }} empresaId={empresaId} />
      <LinkPagamentoDialog open={linkPagamentoOpen} onOpenChange={(v) => { setLinkPagamentoOpen(v); if (!v) setRefreshKey(k => k + 1); }} empresaId={empresaId} />

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
