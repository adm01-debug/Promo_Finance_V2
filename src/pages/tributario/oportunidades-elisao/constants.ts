import type { RiscoElisao } from '@/lib/tributario/elisao';

export const RISCO_BADGE: Record<RiscoElisao, string> = {
  baixo: 'bg-success/10 text-success border-success/30',
  medio: 'bg-warning/10 text-warning border-warning/30',
  alto: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const STATUS_LABEL: Record<string, string> = {
  identificada: 'Identificada',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  implementada: 'Implementada',
  descartada: 'Descartada',
};
