/**
 * Tipos do motor de Obrigações Acessórias (calendário fiscal).
 *
 * O objetivo do módulo é transformar o catálogo legal de obrigações
 * (EFD-Contribuições, EFD-ICMS/IPI, DCTFWeb, EFD-Reinf, eSocial, ECD, ECF...)
 * em prazos determinísticos por competência, com cálculo de multa por
 * atraso na entrega (MAED / art. 57 MP 2.158-35 e art. 12 Lei 8.218/91).
 */

/** Regimes tributários aos quais uma obrigação pode se aplicar. */
export type RegimeAplicavel = 'simples' | 'presumido' | 'real' | 'todos';

/** Periodicidade de entrega. */
export type Periodicidade = 'mensal' | 'trimestral' | 'anual';

/** Órgão destinatário da obrigação. */
export type Orgao = 'RFB' | 'SEFAZ' | 'CAIXA' | 'MTE';

/**
 * Regra de cálculo do prazo de entrega.
 * - `dia_fixo`: dia do calendário, N meses após a competência.
 * - `enesimo_dia_util`: N-ésimo dia útil, N meses após a competência.
 * - `ultimo_dia_util`: último dia útil, N meses após a competência.
 * - `dia_fixo_anual`: mês/dia fixos do ano seguinte ao exercício (ECD/ECF).
 */
export type RegraPrazo =
  | { readonly tipo: 'dia_fixo'; readonly dia: number; readonly mesesApos: number }
  | { readonly tipo: 'enesimo_dia_util'; readonly n: number; readonly mesesApos: number }
  | { readonly tipo: 'ultimo_dia_util'; readonly mesesApos: number }
  | { readonly tipo: 'dia_fixo_anual'; readonly mes: number; readonly ultimoDiaUtil: true };

/** Ajuste aplicado quando o prazo cai em dia não útil. */
export type AjusteDiaNaoUtil = 'antecipa' | 'posterga';

/** Base de cálculo da multa por atraso na entrega. */
export type BaseMulta = 'faturamento' | 'tributos_declarados' | 'fixa';

/** Definição de uma obrigação acessória no catálogo. */
export interface Obrigacao {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string;
  readonly orgao: Orgao;
  readonly periodicidade: Periodicidade;
  readonly regra: RegraPrazo;
  readonly ajuste: AjusteDiaNaoUtil;
  readonly regimes: readonly RegimeAplicavel[];
  /** Base legal resumida (para auditoria e tooltip na UI). */
  readonly baseLegal: string;
  /** Forma de cálculo da multa por entrega em atraso. */
  readonly baseMulta: BaseMulta;
  /** Percentual mensal da multa (fração, ex.: 0.02 = 2% a.m.). */
  readonly multaMensal: number;
  /** Teto percentual da multa (fração). */
  readonly multaTeto: number;
  /** Piso da multa em reais. */
  readonly multaMinima: number;
}

/** Situação de um item do calendário em relação à data de referência. */
export type SituacaoObrigacao = 'entregue' | 'vencida' | 'vence_hoje' | 'proxima' | 'futura';

/** Item materializado do calendário fiscal. */
export interface ItemCalendario {
  readonly obrigacaoId: string;
  readonly nome: string;
  readonly orgao: Orgao;
  readonly competencia: string;
  readonly prazo: string;
  readonly situacao: SituacaoObrigacao;
  /** Dias corridos até o prazo (negativo quando já venceu). */
  readonly diasRestantes: number;
  readonly baseLegal: string;
}

/** Resultado do cálculo de multa por atraso na entrega. */
export interface MultaAtraso {
  readonly diasAtraso: number;
  readonly mesesAtraso: number;
  readonly percentual: number;
  readonly valorCalculado: number;
  readonly valorDevido: number;
  readonly aplicouPiso: boolean;
  readonly aplicouTeto: boolean;
}
