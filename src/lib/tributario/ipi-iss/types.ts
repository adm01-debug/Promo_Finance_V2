/**
 * Tipos do módulo IPI/ISS.
 *
 * Base normativa:
 * - IPI: Decreto 7.212/2010 (RIPI), arts. 190 e 226 (base de cálculo e crédito);
 *   Decreto 11.158/2022 (TIPI vigente).
 * - ISS: LC 116/2003 (lista de serviços, arts. 3º e 7º), LC 157/2016
 *   (alíquota mínima de 2%, art. 8º-A) e IN RFB 1.234/2012 / Lei 10.833/2003
 *   (retenções federais na fonte).
 */

/** Classificação de saída para efeito de IPI. */
export type SituacaoIpi =
  | 'tributada'
  | 'isenta'
  | 'nao_tributada'
  | 'aliquota_zero'
  | 'suspensa'
  | 'imune';

export interface ItemTipi {
  /** NCM com 8 dígitos, sem pontuação. */
  ncm: string;
  descricao: string;
  /** Alíquota ad valorem em decimal (ex.: 0.0325 para 3,25%). */
  aliquota: number;
  /** Situação padrão (NT na TIPI ⇒ `nao_tributada`). */
  situacao: SituacaoIpi;
}

export interface InputIpi {
  /** Valor dos produtos na operação de saída. */
  valorProduto: number;
  frete?: number;
  seguro?: number;
  outrasDespesas?: number;
  /** Descontos incondicionais — NÃO reduzem a base do IPI (RIPI, art. 190, §1º). */
  descontosIncondicionais?: number;
  /** NCM do produto; usado para buscar a alíquota na TIPI embarcada. */
  ncm?: string;
  /** Alíquota informada manualmente (sobrepõe a TIPI), em decimal. */
  aliquotaManual?: number;
  situacao?: SituacaoIpi;
  /** Estabelecimento é industrial ou equiparado (contribuinte do IPI). */
  contribuinte?: boolean;
  /** Crédito de IPI das entradas no período, para apuração. */
  creditoEntradas?: number;
}

export interface LinhaMemoria {
  rubrica: string;
  base: number;
  aliquota: number;
  valor: number;
  fundamento: string;
}

export interface ResultadoIpi {
  baseCalculo: number;
  aliquota: number;
  situacao: SituacaoIpi;
  ipiDevido: number;
  creditoEntradas: number;
  /** Saldo a recolher (positivo) ou credor a transportar (negativo). */
  saldoApurado: number;
  valorTotalNota: number;
  ncmResolvido?: string;
  descricaoNcm?: string;
  alertas: string[];
  memoria: LinhaMemoria[];
}

/** Onde o ISS é devido para o item da lista (LC 116/2003, art. 3º). */
export type LocalIncidencia = 'estabelecimento_prestador' | 'local_da_prestacao' | 'domicilio_tomador';

export interface ItemLc116 {
  /** Item da lista anexa, ex.: '7.02'. */
  item: string;
  descricao: string;
  local: LocalIncidencia;
  /** Retenção do ISS pelo tomador é a regra para o item (LC 116, art. 6º, §2º). */
  retencaoIssPadrao: boolean;
  /** Percentual máximo de dedução de materiais na base (ex.: construção civil). */
  permiteDeducaoMateriais: boolean;
  /** Sujeito à retenção de 11% de INSS por cessão de mão de obra (Lei 8.212, art. 31). */
  retencaoInss11: boolean;
  /** Alíquota de IRRF do art. 647/649 do RIR (1,5% ou 1,0%), em decimal; 0 = não retém. */
  irrfAliquota: number;
}

export interface InputIss {
  /** Item da lista anexa da LC 116/2003. */
  itemLc116: string;
  valorServico: number;
  /** Materiais fornecidos pelo prestador, dedutíveis quando o item permitir. */
  materiais?: number;
  /** Subempreitadas já tributadas, dedutíveis na construção civil. */
  subempreitadas?: number;
  /** Alíquota municipal, em decimal. Entre 2% e 5% (LC 116, art. 8º-A e 8º, II). */
  aliquotaMunicipal: number;
  municipioPrestador: string;
  municipioTomador: string;
  /** Local em que o serviço foi efetivamente executado. */
  municipioExecucao?: string;
  /** Tomador é pessoa jurídica de direito privado (dispara retenções federais). */
  tomadorPessoaJuridica?: boolean;
  /** Tomador é órgão público federal (IN RFB 1.234/2012 — retenção unificada). */
  tomadorOrgaoPublico?: boolean;
  /** Prestador optante pelo Simples Nacional — afasta as retenções federais. */
  prestadorSimplesNacional?: boolean;
  /** Cessão de mão de obra / empreitada — retenção de 11% de INSS. */
  cessaoMaoDeObra?: boolean;
}

export interface ResultadoIss {
  itemLc116: string;
  descricaoItem: string;
  baseCalculo: number;
  aliquota: number;
  issDevido: number;
  /** Município competente para o recolhimento. */
  municipioCompetente: string;
  local: LocalIncidencia;
  issRetidoPeloTomador: boolean;
  retencoes: {
    iss: number;
    irrf: number;
    pis: number;
    cofins: number;
    csll: number;
    inss: number;
    total: number;
  };
  valorLiquidoRecebido: number;
  alertas: string[];
  memoria: LinhaMemoria[];
}
