import { FileText, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const statusConfig = {
  gerado: {
    label: 'Gerado',
    color: 'bg-secondary/10 text-secondary border-secondary/20',
    icon: FileText,
  },
  enviado: { label: 'Enviado', color: 'bg-warning/10 text-warning border-warning/20', icon: Mail },
  pago: {
    label: 'Pago',
    color: 'bg-success/10 text-success border-success/20',
    icon: CheckCircle2,
  },
  vencido: {
    label: 'Vencido',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle,
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: AlertCircle,
  },
};
