/**
 * Motor IRPJ/CSLL — Lucro Real (Etapa F).
 * Base legal: Decreto 9.580/2018 (RIR/2018), Lei 8.981/95 art. 42 e 58,
 * Lei 9.065/95 art. 15 e 16 (trava de 30%), IN RFB 1.700/2017.
 */

/** Forma de apuração do Lucro Real. */
export type FormaApuracao = 'trimestral' | 'anual_estimativa';

/** Natureza de ajuste do LALUR Parte A. */
export type TipoAjuste = 'adicao' | 'exclusao';

/** Tributo ao qual o ajuste se aplica (alguns ajustes valem só para um deles). */
export type AlvoAjuste = 'ambos' | 'irpj' | 'csll';

/** Lançamento do LALUR Parte A. */
export interface AjusteLalur {
  readonly id: string;
  readonly descricao: string;
  readonly tipo: TipoAjuste;
  readonly alvo: AlvoAjuste;
  readonly valor: number;
  /** Fundamento legal exibido na memória de cálculo. */
  readonly fundamento?: string;
}

/** Entrada de um período de apuração (trimestre ou mês de estimativa). */
export interface PeriodoApuracao {
  readonly rotulo: string;
  /** Lucro líquido contábil antes do IRPJ/CSLL. */
  readonly lucroLiquido: number;
  readonly ajustes: readonly AjusteLalur[];
  /** Retenções na fonte e antecipações compensáveis (IRRF sobre aplicações etc.). */
  readonly irrfCompensavel?: number;
  readonly csllRetidaCompensavel?: number;
  /** Receita bruta do período — usada no regime de estimativa mensal. */
  readonly receitaBruta?: number;
  /** Percentual de presunção da atividade (0.08 comércio/indústria, 0.32 serviços…). */
  readonly percentualPresuncaoIrpj?: number;
  readonly percentualPresuncaoCsll?: number;
  /** Demais receitas não operacionais que entram integralmente na estimativa. */
  readonly demaisReceitas?: number;
  /** Meses do período (3 para trimestre, 1 para mês) — define o limite do adicional. */
  readonly meses?: number;
}

/** Saldos de prejuízo (LALUR Parte B) no início da apuração. */
export interface SaldosParteB {
  readonly prejuizoFiscal: number;
  readonly baseNegativaCsll: number;
}

export interface ParametrosApuracao {
  readonly forma: FormaApuracao;
  readonly periodos: readonly PeriodoApuracao[];
  readonly saldosIniciais?: SaldosParteB;
  /**
   * Empresas em fase de atividade rural / SPE incentivada podem ter a trava
   * de 30% afastada. Default: false (trava aplicada).
   */
  readonly dispensaTrava30?: boolean;
}

export interface LinhaMemoriaIrpj {
  readonly rubrica: string;
  readonly valor: number;
  readonly aliquota?: number;
  readonly fundamento: string;
}

export interface ResultadoPeriodo {
  readonly rotulo: string;
  readonly lucroLiquido: number;
  readonly totalAdicoesIrpj: number;
  readonly totalExclusoesIrpj: number;
  readonly totalAdicoesCsll: number;
  readonly totalExclusoesCsll: number;
  readonly lucroRealAntesCompensacao: number;
  readonly baseCsllAntesCompensacao: number;
  readonly compensacaoPrejuizo: number;
  readonly compensacaoBaseNegativa: number;
  readonly lucroReal: number;
  readonly baseCsll: number;
  readonly irpjBase: number;
  readonly irpjAdicional: number;
  readonly irpjDevido: number;
  readonly csllDevida: number;
  readonly irpjCompensado: number;
  readonly csllCompensada: number;
  readonly irpjARecolher: number;
  readonly csllARecolher: number;
  readonly prejuizoGerado: number;
  readonly baseNegativaGerada: number;
  readonly saldoFinal: SaldosParteB;
  readonly memoria: readonly LinhaMemoriaIrpj[];
}

export interface ResultadoApuracao {
  readonly forma: FormaApuracao;
  readonly periodos: readonly ResultadoPeriodo[];
  readonly totalIrpj: number;
  readonly totalCsll: number;
  readonly totalARecolher: number;
  readonly cargaEfetiva: number;
  readonly saldoFinal: SaldosParteB;
  readonly alertas: readonly string[];
}
