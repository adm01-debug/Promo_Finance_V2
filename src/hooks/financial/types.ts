import type { Tables } from '@/integrations/supabase/types';

export type Empresa = Tables<'empresas'>;
export type CentroCusto = Tables<'centros_custo'>;
export type ContaBancaria = Tables<'contas_bancarias'>;
export type Cliente = Tables<'clientes'>;
export type Fornecedor = Tables<'fornecedores'>;
export type ContaPagar = Tables<'contas_pagar'>;
export type ContaReceber = Tables<'contas_receber'>;
export type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado';

export type RegraRoteamento = Tables<'regras_roteamento_financeiro'>;
export type ContaBancariaComRegras = ContaBancaria & {
  empresas?: { razao_social: string | null; nome_fantasia: string | null } | null;
  regras: RegraRoteamento[];
};

export interface ExternalCliente {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj_cpf: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  contato: string | null;
  ativo: boolean;
  ramo_atividade?: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  score?: number | null;
  limite_credito?: number | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  bairro?: string | null;
  website?: string;
  logo_url?: string;
  grupo_economico?: string;
  inscricao_estadual?: string;
  status_externo?: string;
  is_customer?: boolean;
  is_supplier?: boolean;
  vendedor_nome?: string;
  cliente_ativado?: boolean;
  ja_comprou?: boolean;
  total_pedidos?: number;
  valor_total_compras?: number;
  ticket_medio?: number;
  grupo_clientes?: string;
  categoria?: string;
  tipo_fornecedor?: string;
  prazo_entrega_medio?: number;
  pedido_minimo?: number;
  forma_pagamento?: string;
  prazo_pagamento?: string;
  [key: string]: unknown;
}

export interface ExternalListResponse<T> {
  data?: T[];
  total?: number;
  total_pages?: number;
  error?: string;
  message?: string;
  fallback?: boolean;
  missing_secrets?: string[];
}

// Helper to keep select strings from being parsed at the type level (perf).
export const sel = (s: string): string => s;
