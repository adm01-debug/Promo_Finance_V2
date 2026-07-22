import type { CategoriaIS, FaseTransicao, RegimeEspecial, TipoOperacao } from './enums';

export interface OperacaoTributavel {
  id: string;
  empresaId: string;
  tipo: TipoOperacao;
  data: Date;
  valorOperacao: number;
  valorBaseCalculo: number;

  cbsDebito: number;
  cbsCredito: number;
  ibsDebito: number;
  ibsCredito: number;
  isValor: number;

  icmsDebito?: number;
  icmsCredito?: number;
  issValor?: number;
  pisDebito?: number;
  pisCredito?: number;
  cofinsDebito?: number;
  cofinsCredito?: number;

  documentoNumero: string;
  documentoTipo: 'nfe' | 'nfse' | 'cte' | 'nfce';
  chaveAcesso?: string;

  cnpjParceiro: string;
  nomeParceiro: string;
  ufDestino: string;
  municipioDestino: string;

  ncm?: string;
  cfop: string;
  regimeEspecial?: RegimeEspecial;
  categoriaIS?: CategoriaIS;

  splitPaymentAplicado: boolean;
  valorLiquidoRecebido?: number;
  valorRetidoSplitPayment?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ApuracaoTributaria {
  id: string;
  empresaId: string;
  competencia: string;
  anoReferencia: number;
  faseTransicao: FaseTransicao;

  cbsDebitoTotal: number;
  cbsCreditoTotal: number;
  cbsAPagar: number;
  cbsCredorSaldo: number;

  ibsDebitoTotal: number;
  ibsCreditoTotal: number;
  ibsAPagar: number;
  ibsCredorSaldo: number;

  isTotal: number;

  icmsResidualAPagar: number;
  issResidualAPagar: number;
  pisResidualAPagar: number;
  cofinsResidualAPagar: number;

  valorRetidoSplitPayment: number;
  valorARecolherPosRetencao: number;

  totalTributosNovos: number;
  totalTributosAntigos: number;
  totalGeral: number;

  status: 'aberta' | 'fechada' | 'retificada' | 'transmitida';
  dataFechamento?: Date;
  dataTransmissao?: Date;
  protocoloTransmissao?: string;

  createdAt: Date;
  updatedAt: Date;
}
