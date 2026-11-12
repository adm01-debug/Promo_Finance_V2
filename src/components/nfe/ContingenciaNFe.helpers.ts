import { Wifi, WifiOff, Server, FileText } from 'lucide-react';
import { ContingencyMode } from '@/lib/sefaz-contingency';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export const modeConfig: Record<
  ContingencyMode,
  { color: string; icon: typeof Wifi; description: string }
> = {
  normal: {
    color: 'bg-success/10 text-success border-success/20',
    icon: Wifi,
    description: 'Operação normal',
  },
  SCAN: {
    color: 'bg-primary/10 text-primary border-primary/20',
    icon: Server,
    description: 'SCAN - Ambiente Nacional',
  },
  DPEC: {
    color: 'bg-warning/10 text-warning border-warning/20',
    icon: FileText,
    description: 'DPEC - Declaração Prévia',
  },
  FSDA: {
    color: 'bg-accent text-accent-foreground border-accent',
    icon: FileText,
    description: 'FS-DA - Formulário de Segurança',
  },
  SVCAN: {
    color: 'bg-secondary text-secondary-foreground border-secondary',
    icon: Server,
    description: 'SVC-AN - SEFAZ Virtual Nacional',
  },
  SVCRS: {
    color: 'bg-muted text-muted-foreground border-border',
    icon: Server,
    description: 'SVC-RS - SEFAZ Virtual RS',
  },
  offline: {
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: WifiOff,
    description: 'Modo Offline',
  },
};
