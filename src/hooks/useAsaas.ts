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
    mutationFn: (payload: any) => invokeAsaas('criar_cliente', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-customers'] });
      toast.success('Cliente criado no ASAAS');
    },
    onError: (e: any) => toast.error('Erro ao criar cliente: ' + e.message),
  });

  const editarCliente = useMutation({
    mutationFn: (payload: any) => invokeAsaas('editar_cliente', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-customers'] });
      toast.success('Cliente atualizado');
    },
    onError: (e: any) => toast.error('Erro ao editar cliente: ' + e.message),
  });

  const excluirCliente = useMutation({
    mutationFn: (asaasId: string) => invokeAsaas('excluir_cliente', { asaas_id: asaasId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-customers'] });
      toast.success('Cliente removido');
    },
    onError: (e: any) => toast.error('Erro ao excluir cliente: ' + e.message),
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Cobrança criada com sucesso!');
    },
    onError: (e: any) => toast.error('Erro ao criar cobrança: ' + e.message),
  });

  const cancelarCobranca = useMutation({
    mutationFn: (asaasId: string) => invokeAsaas('cancelar_cobranca', { asaas_id: asaasId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Cobrança cancelada');
    },
    onError: (e: any) => toast.error('Erro ao cancelar: ' + e.message),
  });

  const estornarCobranca = useMutation({
    mutationFn: (payload: any) => invokeAsaas('estornar_cobranca', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Estorno realizado com sucesso');
    },
    onError: (e: any) => toast.error('Erro ao estornar: ' + e.message),
  });

  const segundaViaBoleto = useMutation({
    mutationFn: (payload: any) => invokeAsaas('segunda_via_boleto', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      toast.success('Segunda via gerada com novo vencimento');
    },
    onError: (e: any) => toast.error('Erro ao gerar segunda via: ' + e.message),
  });

  const buscarPixQrCode = useMutation({
    mutationFn: (asaasId: string) => invokeAsaas('pix_qrcode', { asaas_id: asaasId }),
    onError: (e: any) => toast.error('Erro ao buscar QR Code: ' + e.message),
  });

  const criarAssinatura = useMutation({
    mutationFn: (payload: any) => invokeAsaas('criar_assinatura', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-subscriptions'] });
      toast.success('Assinatura criada com sucesso');
    },
    onError: (e: any) => toast.error('Erro ao criar assinatura: ' + e.message),
  });

  const cancelarAssinatura = useMutation({
    mutationFn: (asaasId: string) => invokeAsaas('cancelar_assinatura', { asaas_id: asaasId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-subscriptions'] });
      toast.success('Assinatura cancelada');
    },
    onError: (e: any) => toast.error('Erro ao cancelar assinatura: ' + e.message),
  });

  const consultarSaldo = useMutation({
    mutationFn: () => invokeAsaas('consultar_saldo', {}),
  });

  const transferirPix = useMutation({
    mutationFn: (payload: any) => invokeAsaas('transferir_pix', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-transfers'] });
      toast.success('Transferência Pix realizada!');
    },
    onError: (e: any) => toast.error('Erro na transferência: ' + e.message),
  });

  const { data: transfers = [], isLoading: loadingTransfers } = useQuery({
    queryKey: ['asaas-transfers', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('asaas_transfers')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const sincronizarTransferencia = useMutation({
    mutationFn: (asaasId: string) => invokeAsaas('sincronizar_transferencia', { asaas_id: asaasId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-transfers'] });
      toast.success('Status da transferência atualizado');
    },
  });

  const consultarExtrato = useMutation({
    mutationFn: (payload: any) => invokeAsaas('extrato', payload),
    onError: (e: any) => toast.error('Erro ao consultar extrato: ' + e.message),
  });

  const criarLinkPagamento = useMutation({
    mutationFn: (payload: any) => invokeAsaas('criar_link_pagamento', payload),
    onSuccess: () => {
      toast.success('Link de pagamento criado!');
    },
    onError: (e: any) => toast.error('Erro ao criar link: ' + e.message),
  });

  const excluirLinkPagamento = useMutation({
    mutationFn: (id: string) => invokeAsaas('excluir_link_pagamento', { id }),
    onSuccess: () => toast.success('Link removido'),
    onError: (e: any) => toast.error('Erro ao remover link: ' + e.message),
  });

  const simularAntecipacao = useMutation({
    mutationFn: (payload: any) => invokeAsaas('simular_antecipacao', payload),
  });

  const solicitarAntecipacao = useMutation({
    mutationFn: (payload: any) => invokeAsaas('solicitar_antecipacao', payload),
    onSuccess: () => toast.success('Antecipação solicitada com sucesso'),
    onError: (e: any) => toast.error('Erro na antecipação: ' + e.message),
  });

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['asaas-config', empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data, error } = await supabase
        .from('asaas_config')
        .select('*')
        .eq('empresa_id', empresaId)
        .maybeSingle();
      if (error) throw error;
      
      const conf = (data?.configuracoes as any) || {};
      
      return {
        ...data,
        retry_limit: conf.retry_limit || 5,
        retry_interval_minutes: conf.retry_interval_minutes || 30,
        backoff_multiplier: conf.backoff_multiplier || 2.0,
        default_fine_percent: conf.default_fine_percent || 2.0,
        default_interest_percent: conf.default_interest_percent || 1.0,
        alert_email_enabled: conf.alert_email_enabled || false,
        alert_whatsapp_enabled: conf.alert_whatsapp_enabled || false,
        alert_email_address: conf.alert_email_address || '',
        alert_whatsapp_number: conf.alert_whatsapp_number || '',
        failure_threshold: conf.failure_threshold || 5,
        bitrix_trigger_stage: conf.bitrix_trigger_stage || 'WON'
      };
    },
    enabled: !!empresaId,
  });

  const salvarConfig = useMutation({
    mutationFn: async (payload: any) => {
      if (!empresaId) return;
      const { data: current } = await supabase
        .from('asaas_config')
        .select('configuracoes')
        .eq('empresa_id', empresaId)
        .maybeSingle();
      const mergedConfig = { ...(current?.configuracoes as any || {}), ...payload };
      const { error } = await supabase.from('asaas_config').upsert({
        empresa_id: empresaId, configuracoes: mergedConfig, updated_at: new Date().toISOString()
      }, { onConflict: 'empresa_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-config'] });
      toast.success('Configurações salvas');
    },
    onError: (e: any) => toast.error('Erro ao salvar: ' + e.message)
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ['asaas-reconciliation-suggestions', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('asaas_reconciliation_suggestions')
        .select('*, contas_receber(descricao, valor, data_vencimento)')
        .eq('empresa_id', empresaId)
        .eq('status', 'PENDING');
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const gerarSugestoes = useMutation({
    mutationFn: async (payload: any) => {
      if (!empresaId) throw new Error('Empresa não identificada');
      const { error } = await supabase.rpc('generate_reconciliation_suggestions', {
        p_empresa_id: empresaId,
        p_transaction_date: payload.date,
        p_transaction_value: payload.value,
        p_transaction_id: payload.transaction_id
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['asaas-reconciliation-suggestions'] }),
  });

  const aceitarSugestao = useMutation({
    mutationFn: async ({ suggestionId, contaId }: { suggestionId: string, contaId: string }) => {
      await supabase.from('asaas_reconciliation_suggestions').update({ status: 'ACCEPTED' }).eq('id', suggestionId);
      await supabase.from('contas_receber').update({ status: 'pago', data_recebimento: new Date().toISOString().split('T')[0] }).eq('id', contaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-reconciliation-suggestions'] });
      toast.success('Conciliação realizada com sucesso');
    }
  });

  return {
    customers,
    loadingCustomers,
    criarCliente,
    editarCliente,
    excluirCliente,
    payments,
    loadingPayments,
    criarCobranca,
    cancelarCobranca,
    estornarCobranca,
    segundaViaBoleto,
    buscarPixQrCode,
    criarAssinatura,
    cancelarAssinatura,
    consultarSaldo,
    transferirPix,
    transfers,
    loadingTransfers,
    sincronizarTransferencia,
    consultarExtrato,
    criarLinkPagamento,
    excluirLinkPagamento,
    simularAntecipacao,
    solicitarAntecipacao,
    config,
    loadingConfig,
    salvarConfig,
    suggestions,
    aceitarSugestao,
    gerarSugestoes,
    stats: {
      total: payments.length,
      pendentes: payments.filter(p => p.status === 'PENDING').length,
      recebidos: payments.filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).length,
      vencidos: payments.filter(p => p.status === 'OVERDUE').length,
      valorPendente: (payments || []).filter(p => p.status === 'PENDING').reduce((s, p) => s + (p.valor || 0), 0),
      valorRecebido: (payments || []).filter(p => ['RECEIVED', 'CONFIRMED'].includes(p.status)).reduce((s, p) => s + (p.valor_liquido || p.valor || 0), 0),
    },
    obterComprovante: { mutateAsync: async (asaasId: string) => ({ url: null }), isPending: false },
    auditTrail: [],
    loadingAudit: false,
    loadingSuggestions: false,
    detailStats: [],
    syncQueue: [],
    loadingQueue: false,
    reprocessarManual: { mutateAsync: async (payload: any) => {}, mutate: (payload: any) => {}, isPending: false },
    exportarAuditoria: { mutate: (payload?: any) => {}, isPending: false },
    exportarAuditoriaPDF: () => {},
    queueStats: { pendentes: 0, falhas: 0, sucesso: 0 },
    simularBackoff: { mutate: () => {}, isPending: false },
  };
}
