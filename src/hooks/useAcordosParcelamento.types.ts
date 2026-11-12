export interface AcordoParcelamento {
  id: string;
  numero_acordo: string;
  cliente_id: string | null;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  valor_original: number;
  valor_total_acordo: number;
  desconto_aplicado: number;
  juros_aplicado: number;
  numero_parcelas: number;
  valor_parcela: number;
  data_primeiro_vencimento: string;
  dia_vencimento: number;
  status: 'ativo' | 'quitado' | 'cancelado' | 'inadimplente';
  observacoes: string | null;
  contas_receber_ids: string[];
  empresa_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ParcelaAcordo {
  id: string;
  acordo_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  valor_pago: number | null;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  conta_receber_id: string | null;
  created_at: string;
}

export interface CreateAcordoData {
  cliente_id?: string | null;
  cliente_nome: string;
  cliente_email?: string | null;
  cliente_telefone?: string | null;
  valor_original: number;
  desconto_percentual?: number;
  juros_percentual?: number;
  numero_parcelas: number;
  data_primeiro_vencimento: string;
  dia_vencimento: number;
  observacoes?: string | null;
  contas_receber_ids: string[];
  empresa_id: string;
}
