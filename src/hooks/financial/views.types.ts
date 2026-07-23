/**
 * Tipagens manuais para as views `vw_contas_receber_painel` e `vw_contas_pagar_painel`.
 * Essas views não são incluídas em `integrations/supabase/types.ts` (auto-gen).
 * Mantendo aqui garantimos type-safety end-to-end sem `as any`.
 */

export interface ContasReceberPainelRow {
  id: string | null;
  descricao: string | null;
  valor: number | null;
  data_vencimento: string | null;
  data_recebimento: string | null;
  status: string | null;
  cliente_id: string | null;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  empresa_id: string | null;
  categoria_id: string | null;
  centro_custo_id: string | null;
  forma_recebimento: string | null;
  conta_bancaria_id: string | null;
  numero_documento: string | null;
  observacoes: string | null;
  valor_recebido: number | null;
  juros: number | null;
  multa: number | null;
  desconto: number | null;
  recorrente: boolean | null;
  parcela_atual: number | null;
  total_parcelas: number | null;
  anexo_url: string | null;
  score: number | null;
  metadata: Record<string, unknown> | null;
  cliente_nome: string | null;
  etapa_cobranca: string | null;
  tipo_cobranca: string | null;
  numero_parcela_atual: number | null;
  valor_desconto: number | null;
  chave_pix: string | null;
  data_emissao: string | null;
  categoria_nome: string | null;
  cliente_razao_social: string | null;
  cliente_nome_fantasia: string | null;
  cliente_nome_display: string | null;
  centro_custo_nome: string | null;
  conta_bancaria_nome: string | null;
  vendedor_id: string | null;
  [key: string]: unknown;
}

export interface ContasPagarPainelRow {
  id: string | null;
  descricao: string | null;
  valor: number | null;
  data_vencimento: string | null;
  data_pagamento: string | null;
  status: string | null;
  fornecedor_id: string | null;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  empresa_id: string | null;
  categoria_id: string | null;
  centro_custo_id: string | null;
  forma_pagamento: string | null;
  conta_bancaria_id: string | null;
  numero_documento: string | null;
  observacoes: string | null;
  valor_pago: number | null;
  juros: number | null;
  multa: number | null;
  desconto: number | null;
  recorrente: boolean | null;
  parcela_atual: number | null;
  total_parcelas: number | null;
  anexo_url: string | null;
  metadata: Record<string, unknown> | null;
  categoria: string | null;
  fornecedor_nome: string | null;
  categoria_nome: string | null;
  centro_resultado: string | null;
  aprovado_por: string | null;
  tipo_cobranca: string | null;
  fornecedor_razao_social: string | null;
  fornecedor_nome_fantasia: string | null;
  fornecedor_nome_display: string | null;
  centro_custo_nome: string | null;
  conta_bancaria_nome: string | null;
  [key: string]: unknown;
}
