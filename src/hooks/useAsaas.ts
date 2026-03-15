// ============================================
// HOOK: ASAAS INTEGRATION
// Cobranças reais via Boleto, Pix e Cartão
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

  // ===== CLIENTES ASAAS =====
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
      empresa_id: string;
      cliente_id?: string;
      nome: string;
      cpf_cnpj: string;
      email?: string;
      telefone?: string;
      endereco?: Record<string, string>;
    }) => invokeAsaas('criar_cliente', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-customers'] });
      toast.success('Cliente criado no ASAAS');
    },
    onError: (e) => toast.error('Erro ao criar cliente: ' + e.message),
  });

  // ===== COBRANÇAS ASAAS =====
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
      empresa_id: string;
      asaas_customer_id: string;
      tipo: AsaasBillingType;
      valor: number;
      data_vencimento: string;
      descricao?: string;
      conta_receber_id?: string;
      juros?: number;
      multa?: number;
      desconto_valor?: number;
      desconto_dias?: number;
      desconto_tipo?: string;
      cartao?: {
        holder_name: string;
        number: string;
        expiry_month: string;
        expiry_year: string;
        ccv: string;
      };
      email?: string;
      cpf_cnpj?: string;
      cep?: string;
      telefone?: string;
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

  // ===== SALDO =====
  const consultarSaldo = useMutation({
    mutationFn: () => invokeAsaas('consultar_saldo', {}),
  });

  // ===== PIX TRANSFER =====
  const transferirPix = useMutation({
    mutationFn: async (payload: {
      valor: number;
      chave_pix: string;
      tipo_chave?: string;
      descricao?: string;
    }) => invokeAsaas('transferir_pix', payload),
    onSuccess: () => toast.success('Transferência Pix realizada!'),
    onError: (e) => toast.error('Erro na transferência: ' + e.message),
  });

  // ===== ESTATÍSTICAS =====
  const stats = {
    total: payments.length,
    pendentes: payments.filter(p => p.status === 'PENDING').length,
    recebidos: payments.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).length,
    vencidos: payments.filter(p => p.status === 'OVERDUE').length,
    valorPendente: payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.valor, 0),
    valorRecebido: payments.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).reduce((s, p) => s + (p.valor_liquido || p.valor), 0),
  };

  return {
    customers,
    loadingCustomers,
    criarCliente,
    payments,
    loadingPayments,
    criarCobranca,
    cancelarCobranca,
    consultarSaldo,
    transferirPix,
    stats,
  };
}

export default useAsaas;
