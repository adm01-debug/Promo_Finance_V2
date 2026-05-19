// @ts-nocheck
// ============================================
// HOOK: ASAAS INTEGRATION - Full Feature Set
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const { data: result, error } = await (supabase.functions.invoke('asaas-proxy', {
    body: { action, data },
  }) as any);
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
        .select(`
          *,
          clientes:asaas_customers!asaas_payments_asaas_customer_id_fkey(razao_social, cpf_cnpj)
        `)
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(500);
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
    mutationFn: async (payload: {
      empresa_id: string; asaas_customer_id: string; tipo: AsaasBillingType;
      valor: number; data_vencimento: string; descricao?: string;
      conta_receber_id?: string; juros?: number; multa?: number;
      desconto_valor?: number; desconto_dias?: number; desconto_tipo?: string;
      parcelas?: number; valor_parcela?: number;
      cartao?: { holder_name: string; number: string; expiry_month: string; expiry_year: string; ccv: string };
      email?: string; cpf_cnpj?: string; cep?: string; telefone?: string;
      split?: Array<{ walletId: string; percentualValue?: number; fixedValue?: number }>;
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
    onError: (e) => toast.error('Erro ao buscar QR Code: ' + e.message),
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
    onError: (e) => toast.error('Erro ao consultar saldo: ' + e.message),
  });

  // ===== TRANSFERÊNCIA PIX =====
  const transferirPix = useMutation({
    mutationFn: async (payload: {
      valor: number; chave_pix: string; tipo_chave?: string; descricao?: string; 
      empresa_id: string; idempotency_key: string;
    }) => invokeAsaas('transferir_pix', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-transfers'] });
      toast.success('Transferência Pix realizada!');
    },
    onError: (e) => toast.error('Erro na transferência: ' + e.message),
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
    mutationFn: async (asaasId: string) => invokeAsaas('sincronizar_transferencia', { asaas_id: asaasId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-transfers'] });
      toast.success('Status da transferência atualizado');
    },
  });

  // ===== EXTRATO =====
  const consultarExtrato = useMutation({
    mutationFn: async (payload: { startDate?: string; finishDate?: string }) =>
      invokeAsaas('extrato', payload),
    onError: (e) => toast.error('Erro ao consultar extrato: ' + e.message),
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
    onError: (e) => toast.error('Erro ao listar links: ' + e.message),
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

  // ===== COMPROVANTE =====
  const obterComprovante = useMutation({
    mutationFn: async (asaasId: string) => invokeAsaas('obter_comprovante', { asaas_id: asaasId }),
    onError: (e) => toast.error('Erro ao obter comprovante: ' + e.message),
  });

  // ===== AUDITORIA =====
  const { data: auditTrail = [], isLoading: loadingAudit } = useQuery({
    queryKey: ['asaas-audit-trail', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('asaas_audit_trail')
        .select('*, asaas_payments!inner(empresa_id)')
        .eq('asaas_payments.empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
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

  // ===== ESTATÍSTICAS DETALHADAS =====
  const { data: detailStats } = useQuery({
    queryKey: ['asaas-stats', empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data, error } = await supabase.rpc('get_asaas_payment_stats', { p_empresa_id: empresaId });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  // ===== CONFIGURAÇÕES =====
  const { data: config, isLoading: loadingConfig } = useQuery({
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

  const salvarConfig = useMutation({
    mutationFn: async (payload: any) => {
      if (!empresaId) throw new Error('Empresa não selecionada');
      const { data, error } = await supabase
        .from('asaas_config')
        .upsert({ ...payload, empresa_id: empresaId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-config'] });
      toast.success('Configurações salvas');
    },
    onError: (e) => toast.error('Erro ao salvar config: ' + e.message),
  });

  // ===== CONCILIAÇÃO =====
  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery({
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
    mutationFn: async (payload: { date: string; value: number; transaction_id: string }) => {
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
      // 1. Marcar como aceito
      await supabase.from('asaas_reconciliation_suggestions').update({ status: 'ACCEPTED' }).eq('id', suggestionId);
      // 2. Baixar a conta no financeiro (simplificado)
      await supabase.from('contas_receber').update({ status: 'pago', data_recebimento: new Date().toISOString().split('T')[0] }).eq('id', contaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-reconciliation-suggestions'] });
      toast.success('Conciliação realizada com sucesso');
    }
  });

  // ===== FILA DE RETENTATIVAS =====
  const { data: syncQueue = [], isLoading: loadingQueue } = useQuery({
    queryKey: ['asaas-sync-queue', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('asaas_sync_queue')
        .select('*, asaas_payments!inner(empresa_id)')
        .eq('asaas_payments.empresa_id', empresaId)
        .order('next_retry_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId,
  });

  const reprocessarManual = useMutation({
    mutationFn: async ({ paymentId, reason, userId }: { paymentId: string; reason: string; userId: string }) => {
      // 1. Forçamos a retentativa na fila
      const { error: queueError } = await (supabase
        .from('asaas_sync_queue')
        .update({
          attempts: 0,
          status: 'pending',
          next_retry_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId) as any);
      if (queueError) throw queueError;
      
      // 3. Invocamos o proxy para sincronizar imediatamente (o proxy agora registra a auditoria com o motivo)
      return invokeAsaas('sincronizar_pagamento', { payment_id: paymentId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asaas-sync-queue'] });
      queryClient.invalidateQueries({ queryKey: ['asaas-payments'] });
      queryClient.invalidateQueries({ queryKey: ['asaas-audit-trail'] });
      toast.success('Sincronização manual iniciada');
    },
    onError: (e) => toast.error('Erro ao reprocessar: ' + e.message),
  });

  const simularBackoff = useMutation({
    mutationFn: async () => invokeAsaas('simular_backoff', {}),
    onSuccess: () => toast.success('Simulação de backoff concluída'),
    onError: (e) => toast.error('Erro na simulação: ' + e.message),
  });

  // ===== EXPORTAÇÃO =====
  const exportarAuditoria = async () => {
    if (!empresaId) return;
    try {
      const { data, error } = await supabase.rpc('export_asaas_audit_csv', { p_empresa_id: empresaId });
      if (error) throw error;
      
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `auditoria_asaas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Exportação CSV concluída');
    } catch (e: any) {
      toast.error('Erro ao exportar CSV: ' + e.message);
    }
  };

  const exportarAuditoriaPDF = async () => {
    if (!empresaId || !auditTrail.length) return;
    
    try {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(18);
      doc.text('Trilha de Auditoria - ASAAS', 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 30);
      
      const tableData = auditTrail.map((log: any) => [
        format(parseISO(log.created_at), 'dd/MM/yy HH:mm', { locale: ptBR }),
        log.action.replace(/_/g, ' '),
        log.previous_status || '-',
        log.new_status || '-',
        log.details?.message || log.details?.reason || '-'
      ]);

      doc.autoTable({
        startY: 35,
        head: [['Data', 'Ação', 'Status Ant.', 'Status Novo', 'Detalhes']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 8 },
      });

      doc.save(`auditoria_asaas_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Exportação PDF concluída');
    } catch (e: any) {
      toast.error('Erro ao exportar PDF: ' + e.message);
    }
  };

  // ===== STATS ADICIONAIS PARA DASHBOARD =====
  const queueStats = {
    total: syncQueue.length,
    falhas: syncQueue.filter(q => q.status === 'failed').length,
    pendentes: syncQueue.filter(q => q.status === 'pending').length,
    sucesso: syncQueue.filter(q => q.status === 'completed').length,
  };

  return {
    customers, loadingCustomers,
    criarCliente, editarCliente, excluirCliente,
    payments, loadingPayments,
    criarCobranca, cancelarCobranca, estornarCobranca,
    segundaViaBoleto, buscarPixQrCode,
    criarAssinatura, cancelarAssinatura,
    consultarSaldo, transferirPix, consultarExtrato,
    transfers, loadingTransfers, sincronizarTransferencia,
    suggestions, loadingSuggestions, gerarSugestoes, aceitarSugestao,
    detailStats,
    criarLinkPagamento, listarLinksPagamento, excluirLinkPagamento,
    simularAntecipacao, solicitarAntecipacao,
    stats,
    obterComprovante,
    auditTrail,
    loadingAudit,
    // Novos
    config, loadingConfig, salvarConfig,
    syncQueue, loadingQueue, reprocessarManual,
    exportarAuditoria, exportarAuditoriaPDF, queueStats, simularBackoff,
  };
}

export default useAsaas;
