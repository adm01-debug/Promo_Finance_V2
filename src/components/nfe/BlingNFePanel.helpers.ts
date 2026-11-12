import { Ban, CheckCircle2, Clock, XCircle, AlertCircle, Edit } from 'lucide-react';

/** Gap #1: Correct Bling API v3 situation codes */
export const situacaoConfig: Record<
  number,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  1: { label: 'Em Digitação', color: 'bg-muted text-muted-foreground border-muted', icon: Edit },
  2: { label: 'Validando', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  3: { label: 'Aguardando', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  4: {
    label: 'Validada',
    color: 'bg-primary/10 text-primary border-primary/20',
    icon: CheckCircle2,
  },
  5: { label: 'Processando', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  6: {
    label: 'Autorizada',
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle2,
  },
  7: {
    label: 'Cancelada',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
  8: {
    label: 'Rejeitada',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertCircle,
  },
  9: {
    label: 'Denegada',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: AlertCircle,
  },
  10: { label: 'Inutilizada', color: 'bg-muted text-muted-foreground border-muted', icon: Ban },
};

export const defaultSituacao = {
  label: 'Desconhecida',
  color: 'bg-muted text-muted-foreground',
  icon: Clock,
};
