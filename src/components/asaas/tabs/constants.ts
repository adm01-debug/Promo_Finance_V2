import { Banknote, QrCode, CreditCard } from 'lucide-react';
import type { ComponentType } from 'react';

export const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'secondary' },
  RECEIVED: { label: 'Recebido', variant: 'default' },
  CONFIRMED: { label: 'Confirmado', variant: 'default' },
  OVERDUE: { label: 'Vencido', variant: 'destructive' },
  CANCELLED: { label: 'Cancelado', variant: 'outline' },
  REFUNDED: { label: 'Estornado', variant: 'outline' },
  CHARGEBACK: { label: 'Chargeback', variant: 'destructive' },
};

export const tipoIcons: Record<string, ComponentType<{ className?: string }>> = {
  boleto: Banknote, pix: QrCode, credit_card: CreditCard, debit_card: CreditCard,
};

export const tipoLabels: Record<string, string> = {
  boleto: 'Boleto', pix: 'Pix', credit_card: 'Cartão', debit_card: 'Débito',
};
