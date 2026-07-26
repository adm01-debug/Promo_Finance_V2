/**
 * Tipos do módulo PIS/COFINS não cumulativo (apuração de débitos e créditos).
 *
 * Base normativa:
 * - Lei 10.637/2002, art. 1º (base) e art. 3º (créditos de PIS);
 * - Lei 10.833/2003, art. 1º (base) e art. 3º (créditos de COFINS);
 * - IN RFB 2.121/2022 (consolidação da legislação de PIS/COFINS);
 * - STF, RE 574.706 (Tema 69) — exclusão do ICMS da base de PIS/COFINS;
 * - STJ, REsp 1.221.170 (Tema 779) — conceito de insumo (essencialidade/relevância);
 * - Lei 10.865/2004, art. 15 (crédito sobre importação) e art. 8º, §§ (adicional).
 */

/** Alíquotas do regime não cumulativo. */
export const ALIQUOTA_PIS_NAO_CUMULATIVO = 0.0165;
export const ALIQUOTA_COFINS_NAO_CUMULATIVO = 0.076;

/** Naturezas de crédito reconhecidas pelo motor (art. 3º das Leis 10.637/02 e 10.833/03). */
export type NaturezaCredito =
  | 'bens_revenda'
  | 'insumos'
  | 'energia_eletrica'
  | 'energia_termica'
  | 'alugueis_pj'
  | 'arrendamento_mercantil'
  | 'depreciacao_maquinas'
  | 'edificacoes_benfeitorias'
  | 'devolucoes_vendas'
  | 'armazenagem_frete_venda'
  | 'vale_transporte_alimentacao'
  | 'bens_importados';

/** Naturezas de receita quanto à incidência. */
export type NaturezaReceita =
  | 'tributada'
  | 'monofasica'
  | 'substituicao_tributaria'
  | 'aliquota_zero'
  | 'isenta'
  | 'suspensa'
  | 'exportacao';

export interface RegraCredito {
  natureza: NaturezaCredito;
  descricao: string;
  fundamento: string;
  /** Se falso, o item não gera crédito e é apenas informativo. */
  permiteCredito: boolean;
  /** Observação de risco/limite aplicável à natureza. */
  observacao?: string;
}

export interface ItemReceita {
  descricao?: string;
  valor: number;
  natureza: NaturezaReceita;
  /** ICMS destacado no documento fiscal — excluído da base (Tema 69). */
  icmsDestacado?: number;
  /** IPI destacado — nunca compõe a receita bruta. */
  ipiDestacado?: number;
  /** Descontos incondicionais concedidos — reduzem a receita bruta. */
  descontosIncondicionais?: number;
}

export interface ItemCredito {
  descricao?: string;
  natureza: NaturezaCredito;
  /** Valor da aquisição/custo no período. */
  valor: number;
  /** ICMS destacado na entrada — excluído da base do crédito (IN 2.121/22, art. 171). */
  icmsDestacado?: number;
  /** IPI recuperável na entrada — não compõe a base do crédito. */
  ipiRecuperavel?: number;
  /**
   * Fornecedor optante pelo Simples Nacional ou pessoa física:
   * aquisição de PF não gera crédito (Lei 10.637/02, art. 3º, §3º, I).
   */
  fornecedorPessoaFisica?: boolean;
  /** Aquisição sujeita a alíquota zero/monofásica na entrada — sem crédito. */
  entradaSemIncidencia?: boolean;
  /** Número de parcelas para apropriação (depreciação/edificações). */
  parcelas?: number;
}

export interface InputPisCofins {
  competencia?: string;
  receitas: ItemReceita[];
  creditos: ItemCredito[];
  /** Saldo credor acumulado de períodos anteriores (por tributo). */
  saldoCredorAnteriorPis?: number;
  saldoCredorAnteriorCofins?: number;
  /** Retenções na fonte sofridas no período (CSRF), por tributo. */
  retencoesPis?: number;
  retencoesCofins?: number;
}

export interface LinhaMemoria {
  rubrica: string;
  base: number;
  aliquota?: number;
  valor: number;
  fundamento: string;
}

export interface ResultadoTributo {
  baseDebito: number;
  debito: number;
  baseCredito: number;
  creditoPeriodo: number;
  saldoCredorAnterior: number;
  retencoes: number;
  /** Valor a recolher (>= 0). */
  aRecolher: number;
  /** Saldo credor a transportar para o período seguinte (>= 0). */
  saldoCredorFinal: number;
}

export interface ResultadoPisCofins {
  competencia?: string;
  receitaBruta: number;
  receitaTributada: number;
  receitaNaoTributada: number;
  /** Proporção de receita tributada usada em rateio de créditos comuns. */
  percentualRateio: number;
  pis: ResultadoTributo;
  cofins: ResultadoTributo;
  totalARecolher: number;
  cargaEfetiva: number;
  memoria: LinhaMemoria[];
  alertas: string[];
}
