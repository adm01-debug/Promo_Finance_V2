import type { useAsaas } from '@/hooks/useAsaas';
import type { AsaasPayment } from '@/hooks/useAsaas.types';

export type AsaasHook = ReturnType<typeof useAsaas>;

export interface CobrancasTabProps {
  payments: AsaasHook['payments'];
  loadingPayments: AsaasHook['loadingPayments'];
  reprocessarManual: AsaasHook['reprocessarManual'];
  onNovaCobranca: () => void;
  onOpenPixQr: (payload: {
    asaasId: string;
    pixCola?: string | null;
    pixQr?: string | null;
  }) => void;
  onOpenEstorno: (payload: { asaasId: string; valor: number }) => void;
  onOpenSegundaVia: (asaasId: string) => void;
  onOpenAudit: (paymentId: string) => void;
  onOpenBoletoPreview: (payment: AsaasPayment) => void;
  onOpenAnticipation: (asaasId: string) => void;
  onOpenReprocess: (payload: { paymentId: string; asaasId: string }) => void;
  onCancel: (asaasId: string) => void;
  onDownloadComprovante: (asaasId: string) => void;
}
