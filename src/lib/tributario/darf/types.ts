/**
 * Consolidação de DARF (Etapa G).
 * Base legal: Lei 9.430/96 art. 61 e 68, Lei 8.981/95 art. 5º, IN RFB 2.055/2021,
 * Lei 11.196/2005 art. 70 (prazos de retenções), Lei 10.833/2003 art. 35.
 */

/** Tributos federais cobertos pela consolidação. */
export type TributoDarf =
  | 'IRPJ'
  | 'CSLL'
  | 'PIS'
  | 'COFINS'
  | 'IPI'
  | 'IRRF'
  | 'CSRF'
  | 'INSS_RETENCAO';

/** Regra de vencimento aplicável ao código de receita. */
export type RegraVencimento =
  /** Dia 25 do mês subsequente (PIS/COFINS, IPI geral). */
  | 'dia_25_mes_seguinte'
  /** Dia 20 do mês subsequente (retenções na fonte). */
  | 'dia_20_mes_seguinte'
  /** Último dia útil do mês subsequente (IRPJ/CSLL apuração). */
  | 'ultimo_dia_util_mes_seguinte';

/** Metadados de um código de receita da RFB. */
export interface CodigoReceita {
  readonly codigo: string;
  readonly tributo: TributoDarf;
  readonly descricao: string;
  readonly regraVencimento: RegraVencimento;
  /** Admite parcelamento em até 3 quotas (IRPJ/CSLL trimestral). */
  readonly permiteQuotas: boolean;
  readonly fundamento: string;
}

/** Débito individual apurado por um dos motores tributários. */
export interface DebitoApurado {
  readonly id?: string;
  readonly codigo: string;
  /** Competência da apuração no formato AAAA-MM. */
  readonly periodoApuracao: string;
  /** Valor principal devido (>= 0). */
  readonly principal: number;
  /** Origem legível — usada na memória de consolidação. */
  readonly origem?: string;
}

export interface AcrescimosMoratorios {
  readonly diasAtraso: number;
  readonly multaMora: number;
  readonly percentualMulta: number;
  readonly juros: number;
  readonly percentualJuros: number;
}

/** Quota de IRPJ/CSLL trimestral (Lei 9.430/96 art. 5º). */
export interface QuotaDarf {
  readonly numero: number;
  readonly vencimento: string;
  readonly principal: number;
  readonly jurosSelic: number;
  readonly total: number;
}

/** DARF consolidado por código de receita e período de apuração. */
export interface DarfConsolidado {
  readonly codigo: string;
  readonly tributo: TributoDarf;
  readonly descricao: string;
  readonly periodoApuracao: string;
  readonly principal: number;
  /** Saldo trazido de períodos anteriores por não atingir o mínimo de R$ 10,00. */
  readonly principalAcumulado: number;
  readonly vencimento: string;
  readonly acrescimos: AcrescimosMoratorios;
  readonly total: number;
  readonly quotas: readonly QuotaDarf[];
  readonly origens: readonly string[];
  readonly observacoes: readonly string[];
}

export interface ParametrosConsolidacao {
  readonly debitos: readonly DebitoApurado[];
  /** Data de pagamento prevista (ISO AAAA-MM-DD). Default: vencimento. */
  readonly dataPagamento?: string;
  /**
   * Taxa SELIC acumulada por competência (AAAA-MM) em fração (0.0089 = 0,89%).
   * Meses ausentes usam `selicPadraoMensal`.
   */
  readonly selicMensal?: Readonly<Record<string, number>>;
  readonly selicPadraoMensal?: number;
  /** Divide IRPJ/CSLL trimestral em até 3 quotas quando permitido. */
  readonly parcelarEmQuotas?: boolean;
}

export interface ResultadoConsolidacao {
  readonly darfs: readonly DarfConsolidado[];
  /** Débitos abaixo de R$ 10,00 sem período posterior para acumular. */
  readonly diferidos: readonly DarfConsolidado[];
  readonly totalPrincipal: number;
  readonly totalAcrescimos: number;
  readonly totalGeral: number;
}
