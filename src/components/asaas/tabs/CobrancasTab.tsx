import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Search, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { statusConfig } from './constants';
import type { CobrancasTabProps } from './CobrancasTab.types';
import { CobrancasTabConteudo } from './CobrancasTabConteudo';

export function CobrancasTab({
  payments,
  loadingPayments,
  reprocessarManual,
  onNovaCobranca,
  onOpenPixQr,
  onOpenEstorno,
  onOpenSegundaVia,
  onOpenAudit,
  onOpenBoletoPreview,
  onOpenAnticipation,
  onOpenReprocess,
  onCancel,
  onDownloadComprovante,
}: CobrancasTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isBulkReprocessing, setIsBulkReprocessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const filteredPayments = (payments || []).filter((p) => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      !filterSearch ||
      p.descricao?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      p.asaas_id?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      p.asaas_customer_id?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      p.sacado_cpf_cnpj?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      p.sacado_nome?.toLowerCase().includes(filterSearch.toLowerCase());

    let matchesDate = true;
    if (filterDateStart && p.data_vencimento < filterDateStart) matchesDate = false;
    if (filterDateEnd && p.data_vencimento > filterDateEnd) matchesDate = false;

    return matchesStatus && matchesSearch && matchesDate;
  });

  const handleBulkReprocess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setIsBulkReprocessing(true);
    setBulkProgress(0);
    try {
      for (let i = 0; i < selectedPayments.length; i++) {
        await reprocessarManual.mutateAsync({
          paymentId: selectedPayments[i],
          reason: 'Reprocessamento em massa',
          userId: user.id,
        });
        setBulkProgress(((i + 1) / selectedPayments.length) * 100);
      }
      setSelectedPayments([]);
      toast.success('Sincronização em massa concluída');
    } finally {
      setIsBulkReprocessing(false);
    }
  };

  return (
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
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
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
                  onClick={handleBulkReprocess}
                  disabled={isBulkReprocessing}
                >
                  {isBulkReprocessing ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-2" />
                  )}
                  Sincronizar Selecionados
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => setSelectedPayments([])}
                >
                  Limpar Seleção
                </Button>
              </div>
            </div>
            {isBulkReprocessing && (
              <div className="space-y-1">
                <Progress value={bulkProgress} className="h-1" />
                <p className="text-[10px] text-muted-foreground text-center">
                  Processando... {Math.round(bulkProgress)}%
                </p>
              </div>
            )}
          </div>
        )}

        {loadingPayments ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={
              filterSearch || filterStatus !== 'all' || filterDateStart || filterDateEnd
                ? Search
                : CreditCard
            }
            title={payments.length === 0 ? 'Nenhuma cobrança' : 'Nenhum resultado encontrado'}
            description={
              payments.length === 0
                ? 'Crie sua primeira cobrança via Boleto ou Pix'
                : 'Tente ajustar os filtros de busca'
            }
            action={
              payments.length === 0
                ? { label: 'Nova Cobrança', onClick: onNovaCobranca }
                : undefined
            }
          />
        ) : (
          <CobrancasTabConteudo
            selectedPayments={selectedPayments}
            filteredPayments={filteredPayments}
            setSelectedPayments={setSelectedPayments}
            onOpenPixQr={onOpenPixQr}
            onCancel={onCancel}
            onOpenEstorno={onOpenEstorno}
            onOpenSegundaVia={onOpenSegundaVia}
            onOpenAudit={onOpenAudit}
            onOpenBoletoPreview={onOpenBoletoPreview}
            onOpenAnticipation={onOpenAnticipation}
            onOpenReprocess={onOpenReprocess}
            reprocessarManual={reprocessarManual}
            onDownloadComprovante={onDownloadComprovante}
          />
        )}
      </CardContent>
    </Card>
  );
}
