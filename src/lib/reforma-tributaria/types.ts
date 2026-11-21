import type {
  CategoriaIS,
  FaseTransicao,
  RegimeEspecial,
  TipoOperacao,
} from '@/types/reforma-tributaria';

// TIPOS DE ENTRADA

export interface DadosOperacao {
  valorOperacao: number;
  tipoOperacao: TipoOperacao;
  ufOrigem: string;
  ufDestino: string;
  municipioDestino?: string;
  ncm?: string;
  cfop: string;
  regimeEspecial?: RegimeEspecial;
  categoriaIS?: CategoriaIS;
  aliquotaISCustomizada?: number;
  isExportacao?: boolean;
  isImportacao?: boolean;
  /**
   * Alíquota ICMS da operação (%).
   * Padrão: 18 se omitido (histórico nacional — ajuste conforme UF/NCM).
   */
  aliquotaICMS?: number;
  /**
   * Alíquota ISS do serviço (%).
   * Padrão: 5 se omitido.
   */
  aliquotaISS?: number;
  /**
   * Alíquota PIS (%).
   * Padrão: 1.65 se omitido (lucro real não-cumulativo).
   */
  aliquotaPIS?: number;
  /**
   * Alíquota COFINS (%).
   * Padrão: 7.6 se omitido (lucro real não-cumulativo).
   */
  aliquotaCOFINS?: number;
}

/** Resultado de verificação de isenção ou imunidade */
export interface ResultadoIsencao {
  isento: boolean;
  motivo?: string;
  /**
   * true quando há imunidade com manutenção de crédito
   * (ex.: exportação, art. 65 LC 214/2025 — CFOP série 7xxx).
   */
  manutencaoCredito?: boolean;
}

export interface ResultadoCalculo {
  valorBase: number;

  // CBS
  aliquotaCBS: number;
  valorCBS: number;

  // IBS
  aliquotaIBS: number;
  valorIBS: number;
  aliquotaIBSEstadual: number;
  aliquotaIBSMunicipal: number;

  // IS
  aliquotaIS: number;
  valorIS: number;

  // Totais
  totalTributosNovos: number;
  cargaTributariaPercentual: number;

  /**
   * true em 2026: CBS e IBS são compensáveis/dispensados (art. 348 LC 214/2025).
   * Neste caso NÃO compõem a carga tributária efetiva — apenas informativo.
   */
  cbsIbsCompensavel?: boolean;

  // Transição
  icmsResidual: number;
  issResidual: number;
  pisResidual: number;
  cofinsResidual: number;
  totalTributosAntigos: number;

  // Valores finais
  valorLiquido: number;
  valorSplitPaymentCBS: number;
  valorSplitPaymentIBS: number;
  valorTotalSplitPayment: number;

  // Metadados
  faseTransicao: FaseTransicao;
  anoCalculo: number;
  detalhamento: string[];
}

export interface DadosCredito {
  valorAquisicao: number;
  tipoOperacao: 'compra' | 'servico_tomado' | 'importacao';
  regimeEspecial?: RegimeEspecial;
  anoReferencia?: number;
}

export interface ResultadoCredito {
  creditoCBS: number;
  creditoIBS: number;
  creditoTotal: number;
  aliquotaCBSCredito: number;
  aliquotaIBSCredito: number;
  naoCumulatividadePlena: boolean;
  restricoes: string[];
}

export interface DadosSimulacao {
  faturamentoAnual: number;
  comprasAnual: number;
  servicosTomadosAnual: number;
  percentualVendas: number;
  percentualServicos: number;
  regimeEspecial?: RegimeEspecial;
  temProdutosIS?: boolean;
  categoriaIS?: CategoriaIS;
  /** LC 214/2025 ainda não fixou alíquota por categoria — usuário informa a sua. */
  aliquotaISCustomizada?: number;
}

export interface ResultadoSimulacao {
  icmsAntigo: number;
  issAntigo: number;
  pisAntigo: number;
  cofinsAntigo: number;
  totalAntigo: number;
  cargaAntigaPercentual: number;

  cbsNovo: number;
  ibsNovo: number;
  isNovo: number;
  totalNovo: number;
  cargaNovaPercentual: number;

  creditosCBSRecuperaveis: number;
  creditosIBSRecuperaveis: number;
  creditosTotalRecuperaveis: number;

  diferencaAbsoluta: number;
  diferencaPercentual: number;
  impacto: 'economia' | 'aumento' | 'neutro';

  observacoes: string[];
}
