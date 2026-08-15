// Sub-componentes da página Asaas — extraídos para zerar max-lines.
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BoletoPreviewPanel } from '@/components/boletos/BoletoPreviewPanel';
import { statusConfig } from '@/components/asaas/tabs/constants';
import { formatCurrency } from '@/lib/currency';
import type { AsaasPayment } from '@/hooks/useAsaas';

export type DetailStatEntry = { status?: string };

export type AuditTrailLog = {
  id: string;
  payment_id?: string;
  action: string;
  created_at: string;
  details?: { message?: string } | null;
  previous_status?: string | null;
  new_status?: string | null;
};

export interface AsaasStats {
  total: number;
  pendentes: number;
  recebidos: number;
  vencidos: number;
  valorPendente: number;
  valorRecebido: number;
}

export interface SaldoAsaas {
  balance: number;
  totalPending: number;
}

export function AsaasHeader({
  saldo,
  loadingSaldo,
  onConsultarSaldo,
  onOpenClientes,
  onOpenPix,
  onNovaCobranca,
}: {
  saldo: SaldoAsaas | null;
  loadingSaldo: boolean;
  onConsultarSaldo: () => void;
  onOpenClientes: () => void;
  onOpenPix: () => void;
  onNovaCobranca: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Asaas Pagamentos</h1>
        <p className="text-muted-foreground text-sm">Plataforma premium para gestão de recebíveis e liquidação PIX</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onConsultarSaldo} disabled={loadingSaldo}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loadingSaldo ? 'animate-spin' : ''}`} />
          {saldo ? formatCurrency(saldo.balance) : 'Ver Saldo'}
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenClientes}>
          <Users className="h-4 w-4 mr-1" /> Clientes
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenPix}>
          <Send className="h-4 w-4 mr-1" /> Pix
        </Button>
        <Button onClick={onNovaCobranca}>
          <Plus className="h-4 w-4 mr-1" /> Nova Cobrança
        </Button>
      </div>
    </div>
  );
}

export function AsaasKpis({ stats, saldo }: { stats: AsaasStats; saldo: SaldoAsaas | null }) {
  return (
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
  );
}

export function PerformanceChart({ loading, detailStats }: { loading: boolean; detailStats: DetailStatEntry[] }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Performance de Cobrança
        </CardTitle>
        <CardDescription>Volume financeiro por status de pagamento</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        {loading ? (
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
                {(detailStats || []).map((entry: DetailStatEntry, index: number) => (
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
  );
}

export function MetasCard({ stats, onNovaCobranca }: { stats: AsaasStats; onNovaCobranca: () => void }) {
  return (
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

        <Button variant="outline" className="w-full text-xs h-8 border-dashed" onClick={onNovaCobranca}>
          <Plus className="h-3 w-3 mr-2" /> Gerar Nova Cobrança
        </Button>
      </CardContent>
    </Card>
  );
}

export function AuditTrailDialog({
  isOpen,
  onClose,
  paymentId,
  logs,
}: {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string | null;
  logs: AuditTrailLog[];
}) {
  const filtered = logs.filter((a) => a.payment_id === paymentId);
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Trilha de Auditoria"
      message={
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {filtered.map((log: AuditTrailLog) => (
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
          {filtered.length === 0 && (
            <p className="text-sm text-center text-muted-foreground py-4">Nenhum evento registrado ainda.</p>
          )}
        </div>
      }
      confirmText="Fechar"
      onConfirm={onClose}
    />
  );
}

export function ReprocessDialog({
  isOpen,
  onClose,
  asaasId,
  reason,
  onReasonChange,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  asaasId?: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Reprocessar Sincronização"
      message={
        <div className="space-y-4">
          <p>Você está forçando a sincronização manual do pagamento <strong>#{asaasId}</strong>.</p>
          <div className="space-y-2">
            <Label>Motivo do Reprocessamento</Label>
            <Input
              placeholder="Ex: Falha na conciliação, atualização pendente..."
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Esta ação e o motivo serão registrados na trilha de auditoria.</p>
        </div>
      }
      confirmText="Confirmar e Sincronizar"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

export function BoletoPreviewDialog({
  payment,
  empresaNome,
  empresaCnpj,
  onClose,
}: {
  payment: AsaasPayment | null;
  empresaNome?: string;
  empresaCnpj?: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!payment} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualização da Cobrança</DialogTitle>
        </DialogHeader>
        {payment && (
          <BoletoPreviewPanel
            boleto={{
              ...payment,
              sacado_nome: payment.sacado_nome || 'Cliente',
              sacado_cpf_cnpj: null,
              numero: payment.nosso_numero || payment.asaas_id,
              banco: 'Asaas',
              agencia: '0001',
              conta: '123456-7',
              cedente_nome: empresaNome || 'Sua Empresa',
              cedente_cnpj: empresaCnpj ?? null,
              vencimento: payment.data_vencimento,
            }}
            onUpdateStatus={({ status }) => {
              onClose();
              toast.success(`Status atualizado para ${status}`);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function QueueHistoryDialog({
  isOpen,
  onClose,
  logs,
}: {
  isOpen: boolean;
  onClose: () => void;
  logs: Record<string, unknown>[] | null;
}) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Histórico de Falhas (Fila)"
      message={
        <div className="space-y-4 max-h-[350px] overflow-y-auto">
          {logs?.map((log: Record<string, unknown>, i: number) => (
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
      onConfirm={onClose}
    />
  );
}
