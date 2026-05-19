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
  sacado_nome?: string;
  sacado_cpf_cnpj?: string;
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

  const { data: customers = [] } = useQuery({
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
    mutationFn: (payload: any) => invokeAsaas('criar_cliente', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-customers'] });
      toast.success('Cliente criado no ASAAS');
    },
    onError: (e: any) => toast.error('Erro ao criar cliente: ' + e.message),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['asaas-payments', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('asaas_payments')
        .select(`
          *,
          clientes:asaas_customers!asaas_payments_asaas_customer_id_fkey(razao_social, cpf_cnpj)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      return (data || []).map((p: any) => ({
        ...p,
        sacado_nome: p.clientes?.razao_social,
        sacado_cpf_cnpj: p.clientes?.cpf_cnpj
      })) as AsaasPayment[];
    },
    enabled: !!empresaId,
  });

  const criarCobranca = useMutation({
    mutationFn: (payload: any) => invokeAsaas('criar_cobranca', payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Cobrança criada com sucesso!');
    },
    onError: (e: any) => toast.error('Erro ao criar cobrança: ' + e.message),
  });

  const consultarSaldo = useMutation({
    mutationFn: () => invokeAsaas('consultar_saldo', {}),
  });

  const { data: config } = useQuery({
    queryKey: ['asaas-config', empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data, error } = await supabase
        .from('asaas_config')
        .select('*')
        .eq('empresa_id', empresaId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  return {
    customers,
    criarCliente,
    payments,
    criarCobranca,
    consultarSaldo,
    config,
    stats: {
      total: payments.length,
      pendentes: payments.filter(p => p.status === 'PENDING').length,
      recebidos: payments.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).length,
      vencidos: payments.filter(p => p.status === 'OVERDUE').length,
      valorPendente: payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.valor, 0),
      valorRecebido: payments.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).reduce((s, p) => s + (p.valor_liquido || p.valor), 0),
    }
  };
}
