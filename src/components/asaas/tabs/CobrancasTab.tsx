import { useState } from 'react';
import type { AsaasPayment, useAsaas } from '@/hooks/useAsaas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  CreditCard, Search, RefreshCw, Loader2, ExternalLink, QrCode, Copy, Banknote,
  X, Undo2, FileText, History, Eye, Zap, Download, MoreHorizontal,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { statusConfig, tipoIcons, tipoLabels } from './constants';

type AsaasHook = ReturnType<typeof useAsaas>;

export interface CobrancasTabProps {
  payments: AsaasHook['payments'];
  loadingPayments: AsaasHook['loadingPayments'];
  reprocessarManual: AsaasHook['reprocessarManual'];
  onNovaCobranca: () => void;
  onOpenPixQr: (payload: { asaasId: string; pixCola?: string | null; pixQr?: string | null }) => void;
  onOpenEstorno: (payload: { asaasId: string; valor: number }) => void;
  onOpenSegundaVia: (asaasId: string) => void;
  onOpenAudit: (paymentId: string) => void;
  onOpenBoletoPreview: (payment: AsaasPayment) => void;
  onOpenAnticipation: (asaasId: string) => void;
  onOpenReprocess: (payload: { paymentId: string; asaasId: string }) => void;
  onCancel: (asaasId: string) => void;
  onDownloadComprovante: (asaasId: string) => void;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copiado!');
}

function formatDate(dateStr: string) {
  try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR }); } catch { return dateStr; }
}

export function CobrancasTab({
  payments, loadingPayments, reprocessarManual,
  onNovaCobranca, onOpenPixQr, onOpenEstorno, onOpenSegundaVia,
  onOpenAudit, onOpenBoletoPreview, onOpenAnticipation, onOpenReprocess,
  onCancel, onDownloadComprovante,
}: CobrancasTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [isBulkReprocessing, setIsBulkReprocessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const filteredPayments = (payments || []).filter(p => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch = !filterSearch ||
      (p.descricao?.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (p.asaas_id?.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (p.asaas_customer_id?.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (p.sacado_cpf_cnpj?.toLowerCase().includes(filterSearch.toLowerCase())) ||
      (p.sacado_nome?.toLowerCase().includes(filterSearch.toLowerCase()));

    let matchesDate = true;
    if (filterDateStart && p.data_vencimento < filterDateStart) matchesDate = false;
    if (filterDateEnd && p.data_vencimento > filterDateEnd) matchesDate = false;

    return matchesStatus && matchesSearch && matchesDate;
  });

  const handleBulkReprocess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
                  onClick={handleBulkReprocess}
                  disabled={isBulkReprocessing}
                >
                  {isBulkReprocessing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
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
                <p className="text-[10px] text-muted-foreground text-center">Processando... {Math.round(bulkProgress)}%</p>
              </div>
            )}
          </div>
        )}

        {loadingPayments ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={filterSearch || filterStatus !== 'all' || filterDateStart || filterDateEnd ? Search : CreditCard}
            title={payments.length === 0 ? 'Nenhuma cobrança' : 'Nenhum resultado encontrado'}
            description={payments.length === 0 ? 'Crie sua primeira cobrança via Boleto ou Pix' : 'Tente ajustar os filtros de busca'}
            action={payments.length === 0 ? { label: 'Nova Cobrança', onClick: onNovaCobranca } : undefined}
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
                        if ((e.target as HTMLInputElement).checked) setSelectedPayments(filteredPayments.map(p => p.id));
                        else setSelectedPayments([]);
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
                            if ((e.target as HTMLInputElement).checked) setSelectedPayments(prev => [...prev, payment.id]);
                            else setSelectedPayments(prev => prev.filter(id => id !== payment.id));
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
                              onClick={() => onOpenPixQr({ asaasId: payment.asaas_id, pixCola: payment.pix_copia_cola, pixQr: payment.pix_qrcode })}>
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
                              <DropdownMenuItem className="text-destructive" onClick={() => onCancel(payment.asaas_id)}>
                                <X className="h-4 w-4 mr-2" /> Cancelar
                              </DropdownMenuItem>
                            )}
                            {isPaid && (
                              <DropdownMenuItem onClick={() => onOpenEstorno({ asaasId: payment.asaas_id, valor: payment.valor })}>
                                <Undo2 className="h-4 w-4 mr-2" /> Estornar
                              </DropdownMenuItem>
                            )}
                            {(isPending || isOverdue) && isBoleto && (
                              <DropdownMenuItem onClick={() => onOpenSegundaVia(payment.asaas_id)}>
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
                            <DropdownMenuItem onClick={() => onOpenAudit(payment.id)}>
                              <History className="h-4 w-4 mr-2" /> Auditoria
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onOpenBoletoPreview(payment)}>
                              <Eye className="h-4 w-4 mr-2" /> Visualizar Boleto
                            </DropdownMenuItem>
                            {payment.status === 'CONFIRMED' && (
                              <DropdownMenuItem onClick={() => onOpenAnticipation(payment.asaas_id)} className="text-yellow-600 font-medium">
                                <Zap className="h-4 w-4 mr-2" /> Antecipar Valor
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onOpenReprocess({ paymentId: payment.id, asaasId: payment.asaas_id })}>
                              <RefreshCw className={`h-4 w-4 mr-2 ${reprocessarManual.isPending ? 'animate-spin' : ''}`} /> Sincronizar Agora
                            </DropdownMenuItem>
                            {isPaid && (
                              <DropdownMenuItem onClick={() => onDownloadComprovante(payment.asaas_id)}>
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
  );
}
