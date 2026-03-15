// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BLING_CLIENT_ID = 'bling-client'; // Will use env in OAuth flow

async function blingAction(action: string, params: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { data, error } = await supabase.functions.invoke('bling-proxy', {
    body: { action, ...params },
  });

  if (error) throw new Error(error.message || 'Erro na comunicação com Bling');
  if (data?.error) throw new Error(data.error);
  return data;
}

// --- OAuth ---
export function useBlingOAuth() {
  const queryClient = useQueryClient();

  const getAuthUrl = () => {
    const clientId = import.meta.env.VITE_BLING_CLIENT_ID || '';
    const redirectUri = `${window.location.origin}/bling`;
    return `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=bling_auth&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const exchangeCode = useMutation({
    mutationFn: (code: string) =>
      blingAction('oauth_callback', {
        code,
        redirect_uri: `${window.location.origin}/bling`,
      }),
    onSuccess: () => {
      toast.success('Bling conectado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['bling-status'] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao conectar Bling: ${err.message}`);
    },
  });

  return { getAuthUrl, exchangeCode };
}

// --- Connection Status ---
export function useBlingStatus() {
  return useQuery({
    queryKey: ['bling-status'],
    queryFn: async () => {
      try {
        const result = await blingAction('dados_empresa');
        return { connected: true, empresa: result?.data };
      } catch {
        return { connected: false, empresa: null };
      }
    },
    refetchInterval: 5 * 60 * 1000, // check every 5 min
    staleTime: 2 * 60 * 1000,
  });
}

// --- Contatos ---
export function useBlingContatos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-contatos', filtros],
    queryFn: () => blingAction('listar_contatos', { filtros: { limite: 100, ...filtros } }),
    enabled: false, // Manual trigger
  });
}

export function useBlingContatoMutations() {
  const queryClient = useQueryClient();

  const criarContato = useMutation({
    mutationFn: (data: any) => blingAction('criar_contato', { data }),
    onSuccess: () => {
      toast.success('Contato criado no Bling');
      queryClient.invalidateQueries({ queryKey: ['bling-contatos'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const atualizarContato = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      blingAction('atualizar_contato', { id, data }),
    onSuccess: () => {
      toast.success('Contato atualizado no Bling');
      queryClient.invalidateQueries({ queryKey: ['bling-contatos'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarContato, atualizarContato };
}

// --- Pedidos de Venda ---
export function useBlingPedidos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-pedidos', filtros],
    queryFn: () => blingAction('listar_pedidos', { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingPedidoMutations() {
  const queryClient = useQueryClient();

  const criarPedido = useMutation({
    mutationFn: (data: any) => blingAction('criar_pedido', { data }),
    onSuccess: () => {
      toast.success('Pedido criado no Bling');
      queryClient.invalidateQueries({ queryKey: ['bling-pedidos'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const alterarSituacao = useMutation({
    mutationFn: ({ id, idSituacao }: { id: string; idSituacao: number }) =>
      blingAction('alterar_situacao_pedido', { id, idSituacao }),
    onSuccess: () => {
      toast.success('Situação do pedido alterada');
      queryClient.invalidateQueries({ queryKey: ['bling-pedidos'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const gerarNFe = useMutation({
    mutationFn: (id: string) => blingAction('gerar_nfe_pedido', { id }),
    onSuccess: () => {
      toast.success('NF-e gerada a partir do pedido');
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const lancarContas = useMutation({
    mutationFn: (id: string) => blingAction('lancar_contas_pedido', { id }),
    onSuccess: () => toast.success('Contas lançadas a partir do pedido'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarPedido, alterarSituacao, gerarNFe, lancarContas };
}

// --- Produtos ---
export function useBlingProdutos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-produtos', filtros],
    queryFn: () => blingAction('listar_produtos', { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingProdutoMutations() {
  const queryClient = useQueryClient();

  const criarProduto = useMutation({
    mutationFn: (data: any) => blingAction('criar_produto', { data }),
    onSuccess: () => {
      toast.success('Produto criado no Bling');
      queryClient.invalidateQueries({ queryKey: ['bling-produtos'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarProduto };
}

// --- Estoque ---
export function useBlingEstoque(produtoIds?: string[]) {
  return useQuery({
    queryKey: ['bling-estoque', produtoIds],
    queryFn: () =>
      blingAction('saldos_estoque', {
        filtros: { idsProdutos: produtoIds },
      }),
    enabled: false,
  });
}

// --- Financeiro ---
export function useBlingFinanceiro(tipo: 'receber' | 'pagar', filtros?: Record<string, any>) {
  const action = tipo === 'receber' ? 'listar_contas_receber' : 'listar_contas_pagar';
  return useQuery({
    queryKey: ['bling-financeiro', tipo, filtros],
    queryFn: () => blingAction(action, { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingFinanceiroMutations() {
  const queryClient = useQueryClient();

  const darBaixaReceber = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      blingAction('baixa_conta_receber', { id, data }),
    onSuccess: () => {
      toast.success('Baixa registrada no Bling');
      queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const darBaixaPagar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      blingAction('baixa_conta_pagar', { id, data }),
    onSuccess: () => {
      toast.success('Baixa registrada no Bling');
      queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { darBaixaReceber, darBaixaPagar };
}

// --- NF-e ---
export function useBlingNFe(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-nfe', filtros],
    queryFn: () => blingAction('listar_nfe', { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingNFeMutations() {
  const queryClient = useQueryClient();

  const enviarSefaz = useMutation({
    mutationFn: ({ id, enviarEmail }: { id: string; enviarEmail?: boolean }) =>
      blingAction('enviar_nfe_sefaz', { id, enviarEmail }),
    onSuccess: () => {
      toast.success('NF-e enviada ao SEFAZ');
      queryClient.invalidateQueries({ queryKey: ['bling-nfe'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { enviarSefaz };
}

// --- Sync Logs ---
export function useBlingSyncLogs() {
  return useQuery({
    queryKey: ['bling-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bling_sync_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

// --- Webhook Events ---
export function useBlingWebhookEvents() {
  return useQuery({
    queryKey: ['bling-webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bling_webhook_events' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });
}

// --- Formas de Pagamento ---
export function useBlingFormasPagamento() {
  return useQuery({
    queryKey: ['bling-formas-pagamento'],
    queryFn: () => blingAction('formas_pagamento'),
    enabled: false,
  });
}
