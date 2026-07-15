
// PÁGINA: ASAAS - Cobranças & Pagamentos (Full)

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AntecipacaoDialog } from '@/components/asaas/AntecipacaoDialog';
import { TransferenciaPixHistoryPanel } from '@/components/asaas/TransferenciaPixHistoryPanel';
import { BoletoPreviewPanel } from '@/components/boletos/BoletoPreviewPanel';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard, QrCode, Banknote, Plus, RefreshCw, X,
  DollarSign, Clock, CheckCircle2, AlertTriangle, Copy, ExternalLink,
  Send, Users, Undo2, FileText, MoreHorizontal, Link2, Download, History,
  Settings as SettingsIcon, LayoutDashboard, FileSpreadsheet, PlayCircle,
  Search, Filter, Calendar, Bell, Mail, Phone, Loader2, Eye, TrendingUp, Target, Zap,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAsaas } from '@/hooks/useAsaas';
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
    suggestions, loadingSuggestions, aceitarSugestao, gerarSugestoes,
    detailStats,
    // Novos do hook
    config, loadingConfig, salvarConfig,
    syncQueue, loadingQueue, reprocessarManual,
    exportarAuditoria, exportarAuditoriaPDF, queueStats, simularBackoff,
    sincronizarTransferencia,
  } = useAsaas(empresaId);

  // States for Advanced Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Reprocess Dialog state
  const [reprocessDialog, setReprocessDialog] = useState<{ paymentId: string; asaasId: string } | null>(null);
  const [reprocessReason, setReprocessReason] = useState('');
  const [selectedPayments, setSelectedSelectedPayments] = useState<string[]>([]);
  const [isBulkReprocessing, setIsBulkReprocessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

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
  const [selectedBoletoPreview, setSelectedBoletoPreview] = useState<any | null>(null);
  const [selectedAnticipationId, setSelectedAnticipationId] = useState<string | null>(null);
  const [selectedQueueHistory, setSelectedQueueHistory] = useState<any[] | null>(null);

  const { toast: toastToast } = useToast();
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
    } catch (e: Record<string, any>) {
      toast.error('Erro ao buscar comprovante: ' + (e instanceof Error ? e.message : String(e)));
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

  const filteredPayments = (payments || []).filter(p => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch = !filterSearch || 
      (p.descricao?.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (p.asaas_id?.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (p.asaas_customer_id?.toLowerCase().includes(filterSearch.toLowerCase())) || // Search by Asaas Customer ID
      (p.sacado_cpf_cnpj?.toLowerCase().includes(filterSearch.toLowerCase())) || // Search by CPF/CNPJ if available
      (p.sacado_nome?.toLowerCase().includes(filterSearch.toLowerCase())); // Search by Name
    
    let matchesDate = true;
    if (filterDateStart && p.data_vencimento < filterDateStart) matchesDate = false;
    if (filterDateEnd && p.data_vencimento > filterDateEnd) matchesDate = false;

    return matchesStatus && matchesSearch && matchesDate;
  });

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
        userId: user.id
      });
      setReprocessDialog(null);
      setReprocessReason('');
    } catch (e) {
      // toast handled in hook
    }
  };

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
                      tickFormatter={(v) => `R$ ${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`}
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm">Status da Fila</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] pb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Pendente', total: queueStats.pendentes, color: '#f59e0b' },
                        { name: 'Falha', total: queueStats.falhas, color: '#ef4444' },
                        { name: 'Sucesso', total: queueStats.sucesso, color: '#10b981' },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={40}>
                          {[0,1,2].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#ef4444' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Fila de Sincronização</CardTitle>
                      <CardDescription>Monitoramento de retentativas automáticas</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => simularBackoff.mutate()} disabled={simularBackoff.isPending}>
                        <PlayCircle className="h-4 w-4 mr-2" /> Simular
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportarAuditoria.mutate()}>
                            CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportarAuditoriaPDF()}>
                            PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pagamento</TableHead>
                          <TableHead>Tentativas</TableHead>
                          <TableHead>Próxima</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingQueue ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-4">Carregando...</TableCell></TableRow>
                        ) : syncQueue.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Fila vazia</TableCell></TableRow>
                        ) : syncQueue.slice(0, 5).map((item: Record<string, any>) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs truncate max-w-[80px]">{item.payment_id.substring(0,8)}</TableCell>
                            <TableCell>{item.attempts}/{item.max_attempts}</TableCell>
                            <TableCell className="text-xs">{item.next_retry_at ? format(parseISO(item.next_retry_at), 'HH:mm') : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px]">{item.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setReprocessDialog({ paymentId: item.payment_id, asaasId: item.id })} disabled={reprocessarManual.isPending}>
                                <PlayCircle className="h-3.5 w-3.5" />
                              </Button>
                              {item.error_history && item.error_history.length > 0 && (
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setSelectedQueueHistory(item.error_history)}>
                                  <History className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
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
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Limite de Tentativas</Label>
                    <Input type="number" value={config?.retry_limit || 5} 
                      onChange={(e) => salvarConfig.mutate({ retry_limit: parseInt(e.target.value) })} />
                    <p className="text-xs text-muted-foreground">Número máximo de vezes que o sistema tentará sincronizar.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Intervalo Inicial (minutos)</Label>
                    <Input type="number" value={config?.retry_interval_minutes || 30} 
                      onChange={(e) => salvarConfig.mutate({ retry_interval_minutes: parseInt(e.target.value) })} />
                    <p className="text-xs text-muted-foreground">Tempo de espera antes da primeira retentativa.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Multiplicador Backoff</Label>
                    <Input type="number" step="0.5" value={config?.backoff_multiplier || 2.0} 
                      onChange={(e) => salvarConfig.mutate({ backoff_multiplier: parseFloat(e.target.value) })} />
                    <p className="text-xs text-muted-foreground">Fator de aumento do intervalo entre tentativas.</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Multas e Juros Padrão
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Multa Padrão (%)</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={config?.default_fine_percent || 2.0} 
                        onChange={(e) => salvarConfig.mutate({ default_fine_percent: parseFloat(e.target.value) })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Juros Mensais (%)</Label>
                      <Input 
                        type="number" 
                        step="0.1"
                        value={config?.default_interest_percent || 1.0} 
                        onChange={(e) => salvarConfig.mutate({ default_interest_percent: parseFloat(e.target.value) })} 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Alertas de Falha Crítica
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Alertas por E-mail</Label>
                        <p className="text-xs text-muted-foreground">Receba avisos quando a fila atingir o limite</p>
                      </div>
                      <Switch 
                        checked={config?.alert_email_enabled} 
                        onCheckedChange={(v) => salvarConfig.mutate({ alert_email_enabled: v })} 
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Alertas por WhatsApp</Label>
                        <p className="text-xs text-muted-foreground">Avisos via mensagens proativas</p>
                      </div>
                      <Switch 
                        checked={config?.alert_whatsapp_enabled} 
                        onCheckedChange={(v) => salvarConfig.mutate({ alert_whatsapp_enabled: v })} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>E-mail para Alerta</Label>
                      <Input 
                        placeholder="email@exemplo.com" 
                        value={config?.alert_email_address || ''} 
                        onChange={(e) => salvarConfig.mutate({ alert_email_address: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp para Alerta</Label>
                      <Input 
                        placeholder="5511999999999" 
                        value={config?.alert_whatsapp_number || ''} 
                        onChange={(e) => salvarConfig.mutate({ alert_whatsapp_number: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Limite para Alerta (Falhas/Hora)</Label>
                      <Input 
                        type="number" 
                        value={config?.failure_threshold || 5} 
                        onChange={(e) => salvarConfig.mutate({ failure_threshold: parseInt(e.target.value) })} 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <History className="h-4 w-4" /> Integração Bitrix24
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Etapa Gatilho (Auto-Boleto)</Label>
                      <Input 
                        placeholder="Ex: WON, C1:PREPARATION..." 
                        value={config?.bitrix_trigger_stage || 'WON'} 
                        onChange={(e) => salvarConfig.mutate({ bitrix_trigger_stage: e.target.value })} 
                      />
                      <p className="text-[10px] text-muted-foreground">ID da etapa no Bitrix24 que dispara a geração automática.</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Relatórios e Operações
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border rounded-lg bg-muted/20">
                      <h4 className="text-xs font-bold mb-2">Relatório Diário</h4>
                      <p className="text-[10px] text-muted-foreground mb-4">
                        O sistema gera um resumo automático das últimas 24h e envia para o e-mail de alerta configurado.
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full h-8"
                        onClick={async () => {
                          try {
                            const { data, error } = await supabase.functions.invoke('gerar-resumo-financeiro-diario');
                            if (error) throw error;
                            toast.success('Relatório gerado e enviado com sucesso');
                          } catch (e: Record<string, any>) {
                            toast.error('Erro ao gerar relatório: ' + (e instanceof Error ? e.message : String(e)));
                          }
                        }}
                      >
                        <Send className="h-3 w-3 mr-2" /> Disparar Agora
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/20">
                      <h4 className="text-xs font-bold mb-2 text-success flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Saúde da Integração
                      </h4>
                      <div className="space-y-2 mt-3">
                        <div className="flex justify-between text-[10px]">
                          <span>Asaas API:</span>
                          <span className="font-bold text-success">ONLINE</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Webhooks:</span>
                          <span className="font-bold text-success">ATIVO</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Fila de Sincronização:</span>
                          <span className="font-bold text-warning">{queueStats.falhas > 0 ? 'ATENÇÃO' : 'NORMAL'}</span>
                        </div>
                      </div>
                    </div>
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
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por descrição ou ID..." 
                      className="pl-8" 
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input 
                      type="date" 
                      className="w-full md:w-[150px]" 
                      value={filterDateStart}
                      onChange={(e) => setFilterDateStart(e.target.value)}
                    />
                    <Input 
                      type="date" 
                      className="w-full md:w-[150px]" 
                      value={filterDateEnd}
                      onChange={(e) => setFilterDateEnd(e.target.value)}
                    />
                  </div>
                </div>

                {selectedPayments.length > 0 && (
                  <div className="flex flex-col gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        {selectedPayments.length} item(s) selecionado(s)
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8"
                          onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;
                            setIsBulkReprocessing(true);
                            setBulkProgress(0);
                            try {
                              for (let i = 0; i < selectedPayments.length; i++) {
                                await reprocessarManual.mutateAsync({ 
                                  paymentId: selectedPayments[i], 
                                  reason: 'Reprocessamento em massa', 
                                  userId: user.id 
                                });
                                setBulkProgress(((i + 1) / selectedPayments.length) * 100);
                              }
                              setSelectedSelectedPayments([]);
                              toast.success('Sincronização em massa concluída');
                            } finally {
                              setIsBulkReprocessing(false);
                            }
                          }}
                          disabled={isBulkReprocessing}
                        >
                          {isBulkReprocessing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                          Sincronizar Selecionados
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8"
                          onClick={() => setSelectedSelectedPayments([])}
                        >
                          Limpar Seleção
                        </Button>
                      </div>
                    </div>
                    {isBulkReprocessing && (
                      <div className="space-y-1">
                        <Progress value={bulkProgress} className="h-1" />
                        <p className="text-[10px] text-muted-foreground text-center">Processando... {Math.round(bulkProgress)}%</p>
                      </div>
                    )}
                  </div>
                )}

                {loadingPayments ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : filteredPayments.length === 0 ? (
                  <EmptyState 
                    icon={filterSearch || filterStatus !== 'all' || filterDateStart || filterDateEnd ? Search : CreditCard} 
                    title={payments.length === 0 ? "Nenhuma cobrança" : "Nenhum resultado encontrado"} 
                    description={payments.length === 0 ? "Crie sua primeira cobrança via Boleto ou Pix" : "Tente ajustar os filtros de busca"} 
                    action={payments.length === 0 ? { label: 'Nova Cobrança', onClick: () => setDialogOpen(true) } : undefined} 
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox 
                              checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedSelectedPayments(filteredPayments.map(p => p.id));
                                else setSelectedSelectedPayments([]);
                              }}
                            />
                          </TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cliente / CPF / Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Links</TableHead>
                          <TableHead className="w-[80px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map(payment => {
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
                                <Checkbox 
                                  checked={selectedPayments.includes(payment.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedSelectedPayments(prev => [...prev, payment.id]);
                                    else setSelectedSelectedPayments(prev => prev.filter(id => id !== payment.id));
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <TipoIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{tipoLabels[payment.tipo] || payment.tipo}</span>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[250px]">
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs truncate uppercase">{payment.sacado_nome || 'Cliente não identificado'}</span>
                                  <span className="text-[10px] text-muted-foreground">{payment.sacado_cpf_cnpj || 'Sem CPF/CNPJ'}</span>
                                  <span className="text-[10px] truncate italic mt-0.5">{payment.descricao || '-'}</span>
                                </div>
                              </TableCell>
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
                                    <DropdownMenuItem onClick={() => setSelectedBoletoPreview(payment)}>
                                      <Eye className="h-4 w-4 mr-2" /> Visualizar Boleto
                                    </DropdownMenuItem>
                                    {payment.status === 'CONFIRMED' && (
                                      <DropdownMenuItem onClick={() => setSelectedAnticipationId(payment.asaas_id)} className="text-yellow-600 font-medium">
                                        <Zap className="h-4 w-4 mr-2" /> Antecipar Valor
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => setReprocessDialog({ paymentId: payment.id, asaasId: payment.asaas_id })}>
                                      <RefreshCw className={`h-4 w-4 mr-2 ${reprocessarManual.isPending ? 'animate-spin' : ''}`} /> Sincronizar Agora
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

      {/* NOVO: Dialog de Visualização de Boleto */}
      <Dialog open={!!selectedBoletoPreview} onOpenChange={(v) => !v && setSelectedBoletoPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização da Cobrança</DialogTitle>
          </DialogHeader>
          {selectedBoletoPreview && (
            <BoletoPreviewPanel 
              boleto={{
                ...selectedBoletoPreview,
                numero: selectedBoletoPreview.nosso_numero || selectedBoletoPreview.asaas_id,
                banco: 'Asaas',
                agencia: '0001',
                conta: '123456-7', // Placeholder Asaas
                cedente_nome: empresas?.[0]?.razao_social || 'Sua Empresa',
                cedente_cnpj: empresas?.[0]?.cnpj || null,
                vencimento: selectedBoletoPreview.data_vencimento,
              }} 
              onUpdateStatus={({ status }) => {
                // Sincronizar localmente se necessário
                setSelectedBoletoPreview(null);
                toast.success(`Status atualizado para ${status}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* NOVO: Dialog de Antecipação */}
      <AntecipacaoDialog 
        paymentId={selectedAnticipationId} 
        onClose={() => setSelectedAnticipationId(null)} 
        empresaId={empresaId}
      />

      {/* NOVO: Dialog de Logs da Fila */}
      <ConfirmationDialog
        isOpen={!!selectedQueueHistory}
        onClose={() => setSelectedQueueHistory(null)}
        title="Histórico de Falhas (Fila)"
        message={
          <div className="space-y-4 max-h-[350px] overflow-y-auto">
            {selectedQueueHistory?.map((log: Record<string, any>, i: number) => (
              <div key={i} className="p-3 bg-muted/20 rounded-md border text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span>Tentativa #{log.attempt}</span>
                  <span className="text-muted-foreground">{format(parseISO(log.timestamp), 'dd/MM HH:mm', { locale: ptBR })}</span>
                </div>
                <p className="text-destructive font-mono">{log.message}</p>
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
