// ============================================
// HOOK: ASAAS INTEGRATION - Full Feature Set
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AsaasPaymentStatus = 
  | 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' 
  | 'REFUNDED' | 'CANCELLED' | 'CHARGEBACK';

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
  created_at: string;
}

async function invokeAsaas(action: string, data: any) {
  const { data: result, error } = await supabase.functions.invoke('asaas-proxy', {
    body: { action, data },
  });
  if (error) throw new Error(error.message);
  if (result?.errors) {
    throw new Error(result.errors.map((e: any) => e.description).join(', '));
  }
  if (result?.error) {
    throw new Error(result.error);
  }
  return result;
}

export function useAsaas(empresaId?: string) {
  const queryClient = useQueryClient();

  // ===== CLIENTES =====
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['asaas-customers', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('asaas_customers')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AsaasCustomer[];
    },
    enabled: !!empresaId,
  });

  const criarCliente = useMutation({
    mutationFn: async (payload: {
      empresa_id: string; cliente_id?: string; nome: string; cpf_cnpj: string;
      email?: string; telefone?: string; endereco?: Record<string, string>;
    }) => invokeAsaas('criar_cliente', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-customers'] });
      toast.success('Cliente criado no ASAAS');
    },
    onError: (e) => toast.error('Erro ao criar cliente: ' + e.message),
  });

  const editarCliente = useMutation({
    mutationFn: async (payload: {
      asaas_id: string; nome?: string; email?: string; telefone?: string; cpf_cnpj?: string;
    }) => invokeAsaas('editar_cliente', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-customers'] });
      toast.success('Cliente atualizado');
    },
    onError: (e) => toast.error('Erro ao editar cliente: ' + e.message),
  });

  const excluirCliente = useMutation({
    mutationFn: async (asaasId: string) => invokeAsaas('excluir_cliente', { asaas_id: asaasId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-customers'] });
      toast.success('Cliente removido');
    },
    onError: (e) => toast.error('Erro ao excluir cliente: ' + e.message),
  });

  // ===== COBRANÇAS =====
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['asaas-payments', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('asaas_payments')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AsaasPayment[];
    },
    enabled: !!empresaId,
  });

  const criarCobranca = useMutation({
    mutationFn: async (payload: {
      empresa_id: string; asaas_customer_id: string; tipo: AsaasBillingType;
      valor: number; data_vencimento: string; descricao?: string;
      conta_receber_id?: string; juros?: number; multa?: number;
      desconto_valor?: number; desconto_dias?: number; desconto_tipo?: string;
      parcelas?: number; valor_parcela?: number;
      cartao?: { holder_name: string; number: string; expiry_month: string; expiry_year: string; ccv: string };
      email?: string; cpf_cnpj?: string; cep?: string; telefone?: string;
    }) => invokeAsaas('criar_cobranca', payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Cobrança criada com sucesso!', {
        description: data?.invoiceUrl ? 'Link da fatura gerado' : undefined,
      });
    },
    onError: (e) => toast.error('Erro ao criar cobrança: ' + e.message),
  });

  const cancelarCobranca = useMutation({
    mutationFn: async (asaasId: string) => invokeAsaas('cancelar_cobranca', { asaas_id: asaasId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Cobrança cancelada');
    },
    onError: (e) => toast.error('Erro ao cancelar: ' + e.message),
  });

  // ===== ESTORNO =====
  const estornarCobranca = useMutation({
    mutationFn: async (payload: { asaas_id: string; valor?: number; descricao?: string }) =>
      invokeAsaas('estornar_cobranca', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Estorno realizado com sucesso');
    },
    onError: (e) => toast.error('Erro ao estornar: ' + e.message),
  });

  // ===== SEGUNDA VIA =====
  const segundaViaBoleto = useMutation({
    mutationFn: async (payload: { asaas_id: string; nova_data_vencimento: string }) =>
      invokeAsaas('segunda_via_boleto', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Segunda via gerada com novo vencimento');
    },
    onError: (e) => toast.error('Erro ao gerar segunda via: ' + e.message),
  });

  // ===== PIX QR CODE =====
  const buscarPixQrCode = useMutation({
    mutationFn: async (asaasId: string) => invokeAsaas('pix_qrcode', { asaas_id: asaasId }),
  });

  // ===== ASSINATURAS =====
  const criarAssinatura = useMutation({
    mutationFn: async (payload: {
      asaas_customer_id: string; valor: number; ciclo: string; tipo?: string;
      proximo_vencimento: string; descricao?: string; max_parcelas?: number;
    }) => invokeAsaas('criar_assinatura', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-subscriptions'] });
      toast.success('Assinatura criada com sucesso');
    },
    onError: (e) => toast.error('Erro ao criar assinatura: ' + e.message),
  });

  const cancelarAssinatura = useMutation({
    mutationFn: async (asaasId: string) => invokeAsaas('cancelar_assinatura', { asaas_id: asaasId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-subscriptions'] });
      toast.success('Assinatura cancelada');
    },
    onError: (e) => toast.error('Erro ao cancelar assinatura: ' + e.message),
  });

  // ===== SALDO =====
  const consultarSaldo = useMutation({
    mutationFn: () => invokeAsaas('consultar_saldo', {}),
  });

  // ===== TRANSFERÊNCIA PIX =====
  const transferirPix = useMutation({
    mutationFn: async (payload: {
      valor: number; chave_pix: string; tipo_chave?: string; descricao?: string;
    }) => invokeAsaas('transferir_pix', payload),
    onSuccess: () => toast.success('Transferência Pix realizada!'),
    onError: (e) => toast.error('Erro na transferência: ' + e.message),
  });

  // ===== EXTRATO =====
  const consultarExtrato = useMutation({
    mutationFn: async (payload: { startDate?: string; finishDate?: string }) =>
      invokeAsaas('extrato', payload),
  });

  // ===== LINKS DE PAGAMENTO =====
  const criarLinkPagamento = useMutation({
    mutationFn: async (payload: {
      nome: string; valor: number; tipo?: string; descricao?: string;
      dias_limite_vencimento?: number; tipo_cobranca?: string;
      ciclo_assinatura?: string; max_parcelas?: number; notificacoes?: boolean;
    }) => invokeAsaas('criar_link_pagamento', payload),
    onSuccess: (data) => {
      toast.success('Link de pagamento criado!', {
        description: data?.url ? 'Copie e envie para o cliente' : undefined,
      });
    },
    onError: (e) => toast.error('Erro ao criar link: ' + e.message),
  });

  const listarLinksPagamento = useMutation({
    mutationFn: async (payload?: { offset?: string; limit?: string; active?: boolean }) =>
      invokeAsaas('listar_links_pagamento', payload || {}),
  });

  const excluirLinkPagamento = useMutation({
    mutationFn: async (id: string) => invokeAsaas('excluir_link_pagamento', { id }),
    onSuccess: () => toast.success('Link removido'),
    onError: (e) => toast.error('Erro ao remover link: ' + e.message),
  });

  // ===== ANTECIPAÇÃO =====
  const simularAntecipacao = useMutation({
    mutationFn: async (payload: { payment_id: string; installment_id?: string }) =>
      invokeAsaas('simular_antecipacao', payload),
  });

  const solicitarAntecipacao = useMutation({
    mutationFn: async (payload: { payment_id: string; installment_id?: string }) =>
      invokeAsaas('solicitar_antecipacao', payload),
    onSuccess: () => toast.success('Antecipação solicitada com sucesso'),
    onError: (e) => toast.error('Erro na antecipação: ' + e.message),
  });

  // ===== STATS =====
  const stats = {
    total: payments.length,
    pendentes: payments.filter(p => p.status === 'PENDING').length,
    recebidos: payments.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).length,
    vencidos: payments.filter(p => p.status === 'OVERDUE').length,
    valorPendente: payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.valor, 0),
    valorRecebido: payments.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).reduce((s, p) => s + (p.valor_liquido || p.valor), 0),
  };

  return {
    customers, loadingCustomers,
    criarCliente, editarCliente, excluirCliente,
    payments, loadingPayments,
    criarCobranca, cancelarCobranca, estornarCobranca,
    segundaViaBoleto, buscarPixQrCode,
    criarAssinatura, cancelarAssinatura,
    consultarSaldo, transferirPix, consultarExtrato,
    criarLinkPagamento, listarLinksPagamento, excluirLinkPagamento,
    simularAntecipacao, solicitarAntecipacao,
    stats,
  };
}

export default useAsaas;
