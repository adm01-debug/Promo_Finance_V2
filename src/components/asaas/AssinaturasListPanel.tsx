// ============================================
// PANEL: Gerenciar Assinaturas ASAAS
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { RefreshCw, Loader2, X, Search } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  empresaId?: string;
}

const cycleLabels: Record<string, string> = {
  WEEKLY: 'Semanal', BIWEEKLY: 'Quinzenal', MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral', SEMIANNUALLY: 'Semestral', YEARLY: 'Anual',
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ACTIVE: { label: 'Ativa', variant: 'default' },
  INACTIVE: { label: 'Inativa', variant: 'outline' },
  EXPIRED: { label: 'Expirada', variant: 'destructive' },
};

export function AssinaturasListPanel({ empresaId }: Props) {
  const { cancelarAssinatura, customers } = useAsaas(empresaId);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  // Map ASAAS customer IDs to names
  const customerNameMap = new Map(customers.map(c => [c.asaas_id, c.nome]));

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-proxy', {
        body: { action: 'listar_assinaturas', data: { limit: '50' } },
      });
      if (error) throw error;
      setSubscriptions(data?.data || []);
    } catch (e: any) {
      toast.error('Erro ao buscar assinaturas: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (empresaId) fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const handleCancelar = async () => {
    if (!cancelConfirm) return;
    try {
      await cancelarAssinatura.mutateAsync(cancelConfirm);
      setSubscriptions(prev => prev.filter(s => s.id !== cancelConfirm));
    } catch { /* hook handles */ }
    setCancelConfirm(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> Assinaturas
            </CardTitle>
            <CardDescription>Cobranças recorrentes ativas no ASAAS</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSubscriptions} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : subscriptions.length === 0 ? (
            <EmptyState icon={RefreshCw} title="Nenhuma assinatura" description="Crie assinaturas para cobranças recorrentes" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Próx. Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub: any) => {
                    const status = statusLabels[sub.status] || { label: sub.status, variant: 'outline' as const };
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium text-sm">{sub.customer || '-'}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(sub.value || 0)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{cycleLabels[sub.cycle] || sub.cycle}</Badge></TableCell>
                        <TableCell className="text-sm">{sub.nextDueDate || '-'}</TableCell>
                        <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                        <TableCell>
                          {sub.status === 'ACTIVE' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCancelConfirm(sub.id)} title="Cancelar">
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

      <ConfirmationDialog
        isOpen={!!cancelConfirm}
        onClose={() => setCancelConfirm(null)}
        title="Cancelar Assinatura"
        message="Tem certeza que deseja cancelar esta assinatura? Cobranças futuras não serão geradas."
        type="danger"
        confirmText="Sim, Cancelar"
        onConfirm={handleCancelar}
        isLoading={cancelarAssinatura.isPending}
      />
    </>
  );
}
