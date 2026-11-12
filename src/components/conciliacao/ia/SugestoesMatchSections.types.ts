import type { TransacaoOFX } from '@/lib/ofx-parser';
import type { MatchSugestaoIA } from '@/hooks/useConciliacaoIA';

export interface EstatisticasIA {
  comSugestao: number;
  confiancaAlta: number;
  confiancaMedia: number;
  confiancaBaixa: number;
  semMatch: number;
  valorTotalMatches: number;
}

export interface HeaderProps {
  matchesAltaConfiancaCount: number;
  mutationPending: boolean;
  aprovarEmLotePending: boolean;
  onAprovarTodos: () => void;
  onHistorico: () => void;
  onReanalisar: () => void;
  isAnalyzing: boolean;
  estatisticas: EstatisticasIA;
  matchesConfirmadosSize: number;
  lastAnalysis: Date | null;
}

export interface CardProps {
  transacao: TransacaoOFX;
  sugestoes: MatchSugestaoIA[];
  melhorMatch: MatchSugestaoIA;
  isExpanded: boolean;
  onToggle: () => void;
  mutationPending: boolean;
  motivosRejeicaoPorTransacao: Map<string, string>;
  matchesRejeitados: Set<string>;
  onConfirmar: (transacaoId: string, transacaoDescricao: string, sugestao: MatchSugestaoIA) => void;
  onRejeitar: (transacaoId: string, transacaoDescricao: string, sugestao: MatchSugestaoIA) => void;
  abrirDetalhes: (transacao: TransacaoOFX, sugestao: MatchSugestaoIA) => void;
  onConciliarManual: (transacaoId: string) => void;
}
