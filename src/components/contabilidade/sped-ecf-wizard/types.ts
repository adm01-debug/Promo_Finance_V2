import type { SpedGeracaoResult } from '@/hooks/useSpedContabil';

export type Step = 1 | 2 | 3;

export const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Período & ECD' },
  { n: 2, label: 'Validações' },
  { n: 3, label: 'Download' },
];

export const WIZARD_DRAFT_KEY = (empresaId: string, ano: number) =>
  `sped-ecf-wizard-draft:${empresaId}:${ano}`;

export interface WizardProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  empresaId: string;
  anoCalendario: number;
}

export type WizardResultado = SpedGeracaoResult & { arquivo_id?: string };

export type AnchorTarget = { step: Step; targetId: string };

export type DivergTone = 'success' | 'warning' | 'destructive' | 'info';

export interface DivergRow {
  key: string;
  label: string;
  ecfValor: string;
  ecdValor: string;
  tone: DivergTone;
  detalhe?: string;
  anchor?: AnchorTarget;
}
