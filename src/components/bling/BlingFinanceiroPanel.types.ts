export interface BlingContaFinanceira {
  id: string;
  situacao: number;
  vencimento?: string;
  contato?: { nome?: string } | null;
  historico?: string;
  numeroDocumento?: string;
  valor?: number;
}

export interface BlingFormaPagamento {
  id: string;
  descricao?: string;
  tipoPagamento?: string;
  situacao?: string | number;
}

export interface BlingPortador {
  id: string;
  descricao?: string;
  tipo?: string;
}

export interface BlingCategoriaFinanceira {
  id: string;
  descricao?: string;
  tipo?: number;
}

export interface BlingBordero {
  id: string;
  data?: string;
  portador?: { descricao?: string } | null;
  valorTotal?: number;
  situacao?: string;
}
