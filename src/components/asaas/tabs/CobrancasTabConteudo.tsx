import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  CreditCard,
  RefreshCw,
  ExternalLink,
  QrCode,
  Copy,
  Banknote,
  X,
  Undo2,
  FileText,
  History,
  Eye,
  Zap,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { statusConfig, tipoIcons, tipoLabels } from './constants';
import { formatDate, copyToClipboard } from './CobrancasTab.helpers';

interface CobrancasTabConteudoProps {
  selectedPayments: string[];
  filteredPayments: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useAsaas.types').AsaasPayment[];
  setSelectedPayments: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      string[]
    >
  >;
  onOpenPixQr: (payload: {
    asaasId: string;
    pixCola?: string | null;
    pixQr?: string | null;
  }) => void;
  onCancel: (asaasId: string) => void;
  onOpenEstorno: (payload: { asaasId: string; valor: number }) => void;
  onOpenSegundaVia: (asaasId: string) => void;
  onOpenAudit: (paymentId: string) => void;
  onOpenBoletoPreview: (
    payment: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useAsaas.types').AsaasPayment
  ) => void;
  onOpenAnticipation: (asaasId: string) => void;
  onOpenReprocess: (payload: { paymentId: string; asaasId: string }) => void;
  reprocessarManual: {
    mutateAsync: (_payload: Record<string, unknown>) => Promise<void>;
    mutate: (_payload: Record<string, unknown>) => void;
    isPending: boolean;
  };
  onDownloadComprovante: (asaasId: string) => void;
}

export function CobrancasTabConteudo({
  selectedPayments,
  filteredPayments,
  setSelectedPayments,
  onOpenPixQr,
  onCancel,
  onOpenEstorno,
  onOpenSegundaVia,
  onOpenAudit,
  onOpenBoletoPreview,
  onOpenAnticipation,
  onOpenReprocess,
  reprocessarManual,
  onDownloadComprovante,
}: CobrancasTabConteudoProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={
                  selectedPayments.length === filteredPayments.length && filteredPayments.length > 0
                }
                onChange={(e) => {
                  if ((e.target as HTMLInputElement).checked)
                    setSelectedPayments(filteredPayments.map((p) => p.id));
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
          {filteredPayments.map((payment) => {
            const TipoIcon = tipoIcons[payment.tipo] || CreditCard;
            const statusInfo = statusConfig[payment.status] || {
              label: payment.status,
              variant: 'outline' as const,
            };
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
                      if ((e.target as HTMLInputElement).checked)
                        setSelectedPayments((prev) => [...prev, payment.id]);
                      else setSelectedPayments((prev) => prev.filter((id) => id !== payment.id));
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
                    <span className="font-bold text-xs truncate uppercase">
                      {payment.sacado_nome || 'Cliente não identificado'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {payment.sacado_cpf_cnpj || 'Sem CPF/CNPJ'}
                    </span>
                    <span className="text-[10px] truncate italic mt-0.5">
                      {payment.descricao || '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(payment.valor)}</TableCell>
                <TableCell>{formatDate(payment.data_vencimento)}</TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {payment.link_boleto && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                        title="Ver boleto"
                      >
                        <a href={payment.link_boleto} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {isPix && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Ver QR Code Pix"
                        onClick={() =>
                          onOpenPixQr({
                            asaasId: payment.asaas_id,
                            pixCola: payment.pix_copia_cola,
                            pixQr: payment.pix_qrcode,
                          })
                        }
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {payment.pix_copia_cola && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(payment.pix_copia_cola!)}
                        title="Copiar Pix copia e cola"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {payment.linha_digitavel && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(payment.linha_digitavel!)}
                        title="Copiar linha digitável"
                      >
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
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onCancel(payment.asaas_id)}
                        >
                          <X className="h-4 w-4 mr-2" /> Cancelar
                        </DropdownMenuItem>
                      )}
                      {isPaid && (
                        <DropdownMenuItem
                          onClick={() =>
                            onOpenEstorno({ asaasId: payment.asaas_id, valor: payment.valor })
                          }
                        >
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
                        <DropdownMenuItem
                          onClick={() => onOpenAnticipation(payment.asaas_id)}
                          className="text-yellow-600 font-medium"
                        >
                          <Zap className="h-4 w-4 mr-2" /> Antecipar Valor
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          onOpenReprocess({
                            paymentId: payment.id,
                            asaasId: payment.asaas_id,
                          })
                        }
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${reprocessarManual.isPending ? 'animate-spin' : ''}`}
                        />{' '}
                        Sincronizar Agora
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
  );
}
