export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'CHARGEBACK';

export type AsaasBillingType = 'boleto' | 'pix' | 'credit_card' | 'debit_card';

export interface AsaasCustomer {
  id: string;
  asaas_id: string;
  cliente_id: string | null;
  empresa_id: string;
  nome: string;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  created_at: string;
}

export interface AsaasPayment {
  id: string;
  asaas_id: string;
  empresa_id: string;
  asaas_customer_id: string | null;
  conta_receber_id: string | null;
  tipo: AsaasBillingType;
  valor: number;
  valor_liquido: number | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  descricao: string | null;
  nosso_numero: string | null;
  codigo_barras: string | null;
  linha_digitavel: string | null;
  pix_qrcode: string | null;
  pix_copia_cola: string | null;
  link_boleto: string | null;
  link_fatura: string | null;
  sacado_nome?: string;
  sacado_cpf_cnpj?: string;
  created_at: string;
}

export interface AsaasSyncQueueItem {
  id: string;
  payment_id: string | null;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  status: string;
  error_history: Record<string, unknown>[] | null;
}
