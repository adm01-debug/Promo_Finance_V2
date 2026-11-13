import type { Database, Json } from '@/integrations/supabase/types';

export type BoletosInsert = Database['public']['Tables']['boletos']['Insert'];

export type BoletosUpdate = Database['public']['Tables']['boletos']['Update'];

export type EventoPagamento = Record<string, Json>;

export interface Boleto {
  id: string;
  numero: string;
  valor: number;
  vencimento: string;
  sacado_nome: string;
  sacado_cpf_cnpj: string | null;
  cedente_nome: string;
  cedente_cnpj: string | null;
  banco: string;
  agencia: string;
  conta: string;
  linha_digitavel: string;
  codigo_barras: string;
  status: 'gerado' | 'enviado' | 'pago' | 'vencido' | 'cancelado' | 'rastreio';
  asaas_id?: string | null;
  external_provider?: string | null;
  bitrix_id?: string | null;
  bitrix_status?: string | null;
  eventos_pagamento?: EventoPagamento[] | null;
  descricao: string | null;
  observacoes: string | null;
  conta_receber_id: string | null;
  conta_pagar_id: string | null;
  conta_bancaria_id: string | null;
  empresa_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NovoBoletoData {
  sacado_nome: string;
  sacado_cpf_cnpj: string;
  valor: number;
  vencimento: string;
  empresa_id: string;
  conta_bancaria_id: string;
  descricao?: string;
  conta_receber_id?: string;
  conta_pagar_id?: string;
  provider?: 'asaas';
}

export interface EmissaoBoletoConfirmada {
  id: string;
  linhaDigitavel: string;
  codigoBarras: string;
}
