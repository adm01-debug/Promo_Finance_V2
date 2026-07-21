/**
 * Tipos e constantes da aba de Contabilização Automática.
 *
 * Domínio:
 *   Regras que mapeiam eventos financeiros (contas a pagar/receber e
 *   movimentações bancárias) em lançamentos contábeis por partidas dobradas.
 */

export type TipoEvento = 'conta_pagar' | 'conta_receber' | 'movimentacao';

export interface Regra {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_evento: TipoEvento;
  categoria_id: string | null;
  conta_debito_id: string;
  conta_credito_id: string;
  historico_template: string;
  prioridade: number;
  ativo: boolean;
}

export interface PlanoConta {
  id: string;
  codigo: string;
  nome: string | null;
  descricao: string;
  natureza: string;
  tipo: string;
}

export interface Categoria {
  id: string;
  nome: string;
}

export interface EventoLog {
  id: string;
  tipo_evento: string;
  evento_id: string;
  status: string;
  detalhe: string | null;
  created_at: string;
  lancamento_id: string | null;
}

export interface RegraFormState {
  nome: string;
  tipo_evento: TipoEvento;
  categoria_id: string | null;
  conta_debito_id: string;
  conta_credito_id: string;
  historico_template: string;
  prioridade: number;
}

export interface SimFormState {
  tipo_evento: TipoEvento;
  valor: number;
  data: string;
  descricao: string;
  categoria_id: string;
  lote_quantidade: number;
}

/**
 * Retorno de uma execução dry-run da edge function `contabilizar-evento`.
 * Campos opcionais porque `status` pode ser `sem_regra` ou `erro`.
 */
export interface DryRunEntry {
  status: string; // 'simulado' | 'sem_regra' | 'erro' — mantido flexível pois a edge function pode evoluir
  debito?: string;
  credito?: string;
  valor?: number;
  regra?: { nome: string } | null;
  error?: string;
}

export type DryRunOutcome =
  | { type: 'single'; after: DryRunEntry }
  | { type: 'lote'; results: DryRunEntry[] };

export interface DryRunInput {
  simForm: SimFormState;
  isLote: boolean;
  onBefore?: (before: DryRunEntry) => void;
}

export const EVENTOS = [
  { value: 'conta_pagar', label: 'Pagamento (Conta a Pagar)' },
  { value: 'conta_receber', label: 'Recebimento (Conta a Receber)' },
  { value: 'movimentacao', label: 'Movimentação Bancária' },
] as const;
