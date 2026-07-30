import type { StatusCreditoTributario, TipoTributoNovo } from './enums';

export interface CreditoTributario {
  id: string;
  empresaId: string;
  tipo: TipoTributoNovo;
  valor: number;
  valorUtilizado: number;
  valorDisponivel: number;
  dataOrigem: Date;
  dataVencimento?: Date;
  documentoOrigem: string;
  tipoDocumento: 'nfe' | 'nfse' | 'cte' | 'nfce' | 'importacao';
  fornecedorId?: string;
  fornecedorCnpj?: string;
  descricao: string;
  status: StatusCreditoTributario;
  operacaoId?: string;
  chaveAcesso?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaldoCreditosTributarios {
  cbsDisponivel: number;
  cbsUtilizado: number;
  cbsTotal: number;
  ibsDisponivel: number;
  ibsUtilizado: number;
  ibsTotal: number;
  creditosAVencer30Dias: number;
  creditosAVencer60Dias: number;
  creditosAVencer90Dias: number;
}
