import {
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  DollarSign,
  QrCode,
  Wallet,
  Shield,
  Scale,
  Trash2,
} from 'lucide-react';
import type { StatusPagamento } from '@/types/financial';

export const statusConfig: Record<
  StatusPagamento,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  vencido: { label: 'Vencido', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  parcial: { label: 'Parcial', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground border-muted', icon: Trash2 },
};

export const tipoCobrancaConfig: Record<string, { label: string; color: string; icon: typeof Banknote }> = {
  boleto: { label: 'Boleto', color: 'bg-primary/10 text-primary border-primary/20', icon: Banknote },
  pix: { label: 'PIX', color: 'bg-success/10 text-success border-success/20', icon: QrCode },
  cartao: { label: 'Cartão', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: CreditCard },
  transferencia: { label: 'TED', color: 'bg-warning/10 text-warning border-warning/20', icon: Building2 },
  dinheiro: { label: 'Dinheiro', color: 'bg-muted text-muted-foreground border-muted', icon: Wallet },
};

export const etapaIcons: Record<string, typeof Shield> = {
  preventiva: Shield,
  lembrete: Clock,
  cobranca: AlertTriangle,
  negociacao: DollarSign,
  juridico: Scale,
};

export const etapaColors: Record<string, string> = {
  preventiva: 'text-primary',
  lembrete: 'text-warning',
  cobranca: 'text-destructive',
  negociacao: 'text-secondary',
  juridico: 'text-destructive',
};

export const getScoreColor = (score: number) => {
  if (score >= 800) return 'text-success';
  if (score >= 600) return 'text-warning';
  if (score >= 400) return 'text-streak';
  return 'text-destructive';
};

export const getScoreLabel = (score: number) => {
  if (score >= 800) return 'Excelente';
  if (score >= 600) return 'Bom';
  if (score >= 400) return 'Regular';
  return 'Crítico';
};

import type { Database } from '@/integrations/supabase/types';

type ContaReceberRow = Database['public']['Tables']['contas_receber']['Row'];

export interface ClienteData {
  razao_social: string;
  nome_fantasia: string | null;
  score: number | null;
}

export interface ContaReceberWithRelations extends ContaReceberRow {
  clientes: ClienteData | null;
  centros_custo?: { nome: string; codigo: string } | null;
  contas_bancarias?: { banco: string } | null;
  empresas?: { razao_social: string; nome_fantasia: string | null } | null;
  has_protesto?: boolean;
  has_boleto?: boolean;
}
