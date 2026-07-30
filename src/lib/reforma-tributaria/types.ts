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
