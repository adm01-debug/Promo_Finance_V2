import { TransacaoOFX } from '@/lib/ofx-parser';

export interface BaixaAutomaticaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
}

export type Step = 'upload' | 'processing' | 'preview' | 'success' | 'error';

export type TransacaoBancaria = TransacaoOFX & { conta_bancaria_id?: string };

export interface MatchResult {
  transacao: TransacaoBancaria;
  contaId: string;
  cliente: string;
  vencimento: string;
  valor: number;
  confianca: 'alta' | 'media' | 'baixa';
}
