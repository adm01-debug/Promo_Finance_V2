import {
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Banknote,
  QrCode,
  CreditCard,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import type { StatusPagamento, TipoCobranca } from '@/types/financial';

export const statusConfig: Record<
  StatusPagamento,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  pago: {
    label: 'Pago',
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle2,
  },
  pendente: {
    label: 'Pendente',
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock,
  },
  vencido: {
    label: 'Vencido',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertTriangle,
  },
  parcial: {
    label: 'Parcial',
    color: 'bg-secondary/10 text-secondary border-secondary/20',
    icon: TrendingUp,
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: Trash2,
  },
};

export const tipoCobrancaIcons: Record<TipoCobranca, typeof CreditCard> = {
  boleto: Banknote,
  pix: QrCode,
  cartao_credito: CreditCard,
  cartao_debito: CreditCard,
  transferencia: Building2,
  dinheiro: DollarSign,
};
