/**
 * Tipos do módulo ICMS — Substituição Tributária (ST), MVA ajustada e DIFAL.
 *
 * Base normativa:
 * - Convênio ICMS 142/2018 (regras gerais da ST)
 * - Convênio ICMS 52/2017, cláusula décima primeira (fórmula da MVA ajustada)
 * - Resolução do Senado 22/1989 (alíquotas interestaduais 7% e 12%)
 * - Resolução do Senado 13/2012 (alíquota de 4% para mercadoria importada)
 * - EC 87/2015 e Convênio ICMS 236/2021 (DIFAL a consumidor final não contribuinte)
 * - LC 190/2022, art. 13 (base de cálculo dupla do DIFAL — "por dentro")
 */

/** Unidades federativas brasileiras. */
export type UF =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO' | 'MA'
  | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI' | 'RJ' | 'RN'
  | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

/** Regiões usadas na regra de alíquota interestadual (Resolução SF 22/1989). */
export type RegiaoFiscal = 'N' | 'NE' | 'CO' | 'SE' | 'S';

/**
 * Origem da mercadoria conforme a Tabela A do Convênio s/nº de 1970
 * (campo `orig` do CST). Origens 1, 2, 3, 6, 7 e 8 são importadas ou com
 * conteúdo de importação superior a 40% e sujeitam-se aos 4% da RSF 13/2012.
 */
export type OrigemMercadoria = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface AliquotaUf {
  /** Alíquota modal interna, em decimal (ex.: 0.18). */
  interna: number;
  /** Adicional de FCP — Fundo de Combate à Pobreza, em decimal. */
  fcp: number;
  regiao: RegiaoFiscal;
  nome: string;
}

export interface InputMvaAjustada {
  /** MVA-ST original prevista no protocolo/convênio, em decimal (ex.: 0.4025). */
  mvaOriginal: number;
  /** Alíquota interestadual aplicável à operação, em decimal. */
  aliquotaInterestadual: number;
  /** Alíquota interna da UF de destino (inclui FCP quando o estado assim exigir). */
  aliquotaInterna: number;
}

export interface InputIcmsSt {
  ufOrigem: UF;
  ufDestino: UF;
  /** Valor dos produtos, sem IPI e sem descontos incondicionais. */
  valorProduto: number;
  frete?: number;
  seguro?: number;
  outrasDespesas?: number;
  /** Descontos incondicionais reduzem a base própria e a base da ST. */
  descontos?: number;
  /** IPI destacado — integra a base da ST, mas não a base própria em revenda. */
  ipi?: number;
  /** MVA-ST original do protocolo, em decimal. */
  mvaOriginal: number;
  /** Origem da mercadoria (define o uso da alíquota de 4%). */
  origem?: OrigemMercadoria;
  /** Override da alíquota interna de destino, em decimal. */
  aliquotaInternaDestino?: number;
  /** Override da alíquota interestadual, em decimal. */
  aliquotaInterestadual?: number;
  /** Redução de base de cálculo na operação própria, em decimal (ex.: 0.2867). */
  reducaoBasePropria?: number;
  /** Redução de base de cálculo na ST, em decimal. */
  reducaoBaseSt?: number;
  /** Preço Médio Ponderado a Consumidor Final — quando existe pauta, prevalece sobre a MVA. */
  pmpf?: number;
  /** Aplica o adicional de FCP da UF de destino sobre a base da ST. */
  aplicarFcp?: boolean;
  /** Override do FCP de destino, em decimal. */
  aliquotaFcp?: number;
}

export interface ResultadoIcmsSt {
  baseIcmsProprio: number;
  aliquotaInterestadual: number;
  icmsProprio: number;
  mvaOriginal: number;
  mvaAjustada: number;
  /** `true` quando a base da ST veio de PMPF/pauta em vez da MVA. */
  usouPmpf: boolean;
  baseSt: number;
  aliquotaInternaDestino: number;
  icmsStBruto: number;
  /** ICMS-ST a recolher = ST bruto − ICMS próprio, nunca negativo. */
  icmsSt: number;
  aliquotaFcp: number;
  fcpSt: number;
  totalRecolher: number;
  /** Custo total da nota para o adquirente. */
  valorTotalNota: number;
  operacaoInterestadual: boolean;
  linhas: LinhaIcms[];
  alertas: string[];
}

export interface InputDifal {
  ufOrigem: UF;
  ufDestino: UF;
  /** Valor da operação (mercadoria + frete + seguro + despesas − descontos). */
  valorOperacao: number;
  /** Destinatário contribuinte do ICMS? Define a base de cálculo aplicável. */
  destinatarioContribuinte?: boolean;
  origem?: OrigemMercadoria;
  aliquotaInternaDestino?: number;
  aliquotaInterestadual?: number;
  aplicarFcp?: boolean;
  aliquotaFcp?: number;
  /**
   * Base dupla ("por dentro"): recompõe a base pela alíquota interna de destino,
   * na forma da LC 190/2022. Padrão `true` para não contribuinte.
   */
  baseDupla?: boolean;
}

export interface ResultadoDifal {
  aliquotaInterestadual: number;
  aliquotaInternaDestino: number;
  baseOrigem: number;
  baseDestino: number;
  icmsOrigem: number;
  icmsDestino: number;
  difal: number;
  aliquotaFcp: number;
  fcp: number;
  totalDestino: number;
  totalRecolher: number;
  operacaoInterestadual: boolean;
  linhas: LinhaIcms[];
  alertas: string[];
}

export interface LinhaIcms {
  rubrica: string;
  base: number;
  aliquota: number;
  valor: number;
  fundamento: string;
}
