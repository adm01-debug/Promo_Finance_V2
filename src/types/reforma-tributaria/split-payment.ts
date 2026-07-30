export interface SplitPaymentConfig {
  id: string;
  empresaId: string;
  contaBancariaId: string;
  ativo: boolean;

  retencaoCBSAutomatica: boolean;
  retencaoIBSAutomatica: boolean;
  percentualRetencaoCBS: number;
  percentualRetencaoIBS: number;

  valorMinimoRetencao: number;

  bancoCodigo: string;
  agencia: string;
  conta: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface TransacaoSplitPayment {
  id: string;
  empresaId: string;
  operacaoId: string;

  valorBruto: number;
  valorCBSRetido: number;
  valorIBSRetido: number;
  valorLiquido: number;

  dataTransacao: Date;
  dataRepasse: Date;

  statusRepasse: 'pendente' | 'processado' | 'falha';
  protocoloRepasse?: string;

  chaveAcessoNFe?: string;
  numeroDocumento: string;

  createdAt: Date;
}
