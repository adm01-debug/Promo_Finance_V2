import {
  AlertCircle,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
  TrendingDown,
  Users,
  CheckCircle2,
  DollarSign,
  Bell,
} from 'lucide-react';
import { type PrioridadeAlerta } from '@/hooks/useAlertas';

export const prioridadeConfig: Record<PrioridadeAlerta, {
  label: string; color: string; bgColor: string; borderColor: string;
  glowColor: string; icon: typeof AlertCircle; gradient: string;
}> = {
  critica: { label: 'Crítica', color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/30', glowColor: 'shadow-destructive/20', icon: XCircle, gradient: 'from-destructive/20 to-destructive/5' },
  alta: { label: 'Alta', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30', glowColor: 'shadow-warning/20', icon: AlertTriangle, gradient: 'from-warning/20 to-warning/5' },
  media: { label: 'Média', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/30', glowColor: 'shadow-primary/20', icon: AlertCircle, gradient: 'from-primary/20 to-primary/5' },
  baixa: { label: 'Baixa', color: 'text-muted-foreground', bgColor: 'bg-muted', borderColor: 'border-border', glowColor: 'shadow-muted/20', icon: Info, gradient: 'from-muted to-muted/50' },
};

export const tipoConfig: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  vencimento: { label: 'Vencimento', icon: Calendar, color: 'text-warning' },
  fluxo_caixa: { label: 'Fluxo de Caixa', icon: TrendingDown, color: 'text-destructive' },
  inadimplencia: { label: 'Inadimplência', icon: Users, color: 'text-accent-foreground' },
  conciliacao: { label: 'Conciliação', icon: CheckCircle2, color: 'text-secondary-foreground' },
  meta: { label: 'Meta', icon: DollarSign, color: 'text-success' },
  sistema: { label: 'Sistema', icon: Bell, color: 'text-muted-foreground' },
};
