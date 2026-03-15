// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

async function blingAction(action: string, params: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { data, error } = await supabase.functions.invoke('bling-proxy', {
    body: { action, ...params },
  });

  if (error) throw new Error(error.message || 'Erro na comunicação com Bling');
  if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
  return data;
}

// ═══════════════ OAuth ═══════════════
export function useBlingOAuth() {
  const queryClient = useQueryClient();

  const getAuthUrl = () => {
    const clientId = import.meta.env.VITE_BLING_CLIENT_ID || '';
    const redirectUri = `${window.location.origin}/bling`;
    return `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${clientId}&state=bling_auth&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const exchangeCode = useMutation({
    mutationFn: (code: string) =>
      blingAction('oauth_callback', { code, redirect_uri: `${window.location.origin}/bling` }),
    onSuccess: () => {
      toast.success('Bling conectado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['bling-status'] });
    },
    onError: (err: Error) => toast.error(`Erro ao conectar Bling: ${err.message}`),
  });

  return { getAuthUrl, exchangeCode };
}

// ═══════════════ Status ═══════════════
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
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

// ═══════════════ CONTATOS ═══════════════
export function useBlingContatos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-contatos', filtros],
    queryFn: () => blingAction('listar_contatos', { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingContatoDetail(id?: string) {
  return useQuery({
    queryKey: ['bling-contato', id],
    queryFn: () => blingAction('buscar_contato', { id }),
    enabled: !!id,
  });
}

export function useBlingTiposContato() {
  return useQuery({
    queryKey: ['bling-tipos-contato'],
    queryFn: () => blingAction('tipos_contato'),
    enabled: false,
  });
}

export function useBlingContatoMutations() {
  const queryClient = useQueryClient();

  const criarContato = useMutation({
    mutationFn: (data: any) => blingAction('criar_contato', { data }),
    onSuccess: () => { toast.success('Contato criado no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-contatos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const atualizarContato = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blingAction('atualizar_contato', { id, data }),
    onSuccess: () => { toast.success('Contato atualizado no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-contatos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const excluirContatos = useMutation({
    mutationFn: (ids: string[]) => blingAction('excluir_contatos', { ids }),
    onSuccess: () => { toast.success('Contato(s) excluído(s)'); queryClient.invalidateQueries({ queryKey: ['bling-contatos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const alterarSituacaoContato = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blingAction('alterar_situacao_contato', { id, data }),
    onSuccess: () => { toast.success('Situação alterada'); queryClient.invalidateQueries({ queryKey: ['bling-contatos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarContato, atualizarContato, excluirContatos, alterarSituacaoContato };
}

// ═══════════════ PEDIDOS DE VENDA ═══════════════
export function useBlingPedidos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-pedidos', filtros],
    queryFn: () => blingAction('listar_pedidos', { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingPedidoDetail(id?: string) {
  return useQuery({
    queryKey: ['bling-pedido', id],
    queryFn: () => blingAction('buscar_pedido', { id }),
    enabled: !!id,
  });
}

export function useBlingPedidoMutations() {
  const queryClient = useQueryClient();

  const criarPedido = useMutation({
    mutationFn: (data: any) => blingAction('criar_pedido', { data }),
    onSuccess: () => { toast.success('Pedido criado no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-pedidos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const atualizarPedido = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blingAction('atualizar_pedido', { id, data }),
    onSuccess: () => { toast.success('Pedido atualizado'); queryClient.invalidateQueries({ queryKey: ['bling-pedidos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const excluirPedidos = useMutation({
    mutationFn: (ids: string[]) => blingAction('excluir_pedidos', { ids }),
    onSuccess: () => { toast.success('Pedido(s) excluído(s)'); queryClient.invalidateQueries({ queryKey: ['bling-pedidos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const alterarSituacao = useMutation({
    mutationFn: ({ id, idSituacao }: { id: string; idSituacao: number }) => blingAction('alterar_situacao_pedido', { id, idSituacao }),
    onSuccess: () => { toast.success('Situação do pedido alterada'); queryClient.invalidateQueries({ queryKey: ['bling-pedidos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const gerarNFe = useMutation({
    mutationFn: (id: string) => blingAction('gerar_nfe_pedido', { id }),
    onSuccess: () => toast.success('NF-e gerada a partir do pedido'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const gerarNFCe = useMutation({
    mutationFn: (id: string) => blingAction('gerar_nfce_pedido', { id }),
    onSuccess: () => toast.success('NFC-e gerada a partir do pedido'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const lancarEstoque = useMutation({
    mutationFn: (id: string) => blingAction('lancar_estoque_pedido', { id }),
    onSuccess: () => toast.success('Estoque lançado'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const estornarEstoque = useMutation({
    mutationFn: (id: string) => blingAction('estornar_estoque_pedido', { id }),
    onSuccess: () => toast.success('Estoque estornado'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const lancarContas = useMutation({
    mutationFn: (id: string) => blingAction('lancar_contas_pedido', { id }),
    onSuccess: () => toast.success('Contas lançadas a partir do pedido'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const estornarContas = useMutation({
    mutationFn: (id: string) => blingAction('estornar_contas_pedido', { id }),
    onSuccess: () => toast.success('Contas estornadas'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarPedido, atualizarPedido, excluirPedidos, alterarSituacao, gerarNFe, gerarNFCe, lancarEstoque, estornarEstoque, lancarContas, estornarContas };
}

// ═══════════════ PRODUTOS ═══════════════
export function useBlingProdutos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-produtos', filtros],
    queryFn: () => blingAction('listar_produtos', { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingProdutoDetail(id?: string) {
  return useQuery({
    queryKey: ['bling-produto', id],
    queryFn: () => blingAction('buscar_produto', { id }),
    enabled: !!id,
  });
}

export function useBlingProdutoMutations() {
  const queryClient = useQueryClient();

  const criarProduto = useMutation({
    mutationFn: (data: any) => blingAction('criar_produto', { data }),
    onSuccess: () => { toast.success('Produto criado no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-produtos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const atualizarProduto = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blingAction('atualizar_produto', { id, data }),
    onSuccess: () => { toast.success('Produto atualizado'); queryClient.invalidateQueries({ queryKey: ['bling-produtos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const excluirProdutos = useMutation({
    mutationFn: (ids: string[]) => blingAction('excluir_produtos', { ids }),
    onSuccess: () => { toast.success('Produto(s) excluído(s)'); queryClient.invalidateQueries({ queryKey: ['bling-produtos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarProduto, atualizarProduto, excluirProdutos };
}

// Variações
export function useBlingVariacoes(produtoId?: string) {
  return useQuery({
    queryKey: ['bling-variacoes', produtoId],
    queryFn: () => blingAction('listar_variacoes', { id: produtoId }),
    enabled: false,
  });
}

export function useBlingVariacoesMutations() {
  const queryClient = useQueryClient();

  const criarVariacoes = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blingAction('criar_variacoes', { id, data }),
    onSuccess: () => { toast.success('Variações criadas'); queryClient.invalidateQueries({ queryKey: ['bling-variacoes'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const gerarCombinacoes = useMutation({
    mutationFn: (data: any) => blingAction('gerar_combinacoes', { data }),
    onSuccess: () => toast.success('Combinações geradas'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarVariacoes, gerarCombinacoes };
}

// ═══════════════ ESTOQUE ═══════════════
export function useBlingEstoque(produtoIds?: string[]) {
  return useQuery({
    queryKey: ['bling-estoque', produtoIds],
    queryFn: () => blingAction('saldos_estoque', { filtros: { idsProdutos: produtoIds } }),
    enabled: false,
  });
}

export function useBlingDepositos() {
  return useQuery({
    queryKey: ['bling-depositos'],
    queryFn: () => blingAction('listar_depositos'),
    enabled: false,
  });
}

export function useBlingEstoqueMutations() {
  const queryClient = useQueryClient();

  const lancarEstoque = useMutation({
    mutationFn: (data: any) => blingAction('lancar_estoque', { data }),
    onSuccess: () => { toast.success('Movimentação de estoque lançada'); queryClient.invalidateQueries({ queryKey: ['bling-estoque'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const criarDeposito = useMutation({
    mutationFn: (data: any) => blingAction('criar_deposito', { data }),
    onSuccess: () => { toast.success('Depósito criado'); queryClient.invalidateQueries({ queryKey: ['bling-depositos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { lancarEstoque, criarDeposito };
}

// ═══════════════ FINANCEIRO ═══════════════
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

  const criarContaReceber = useMutation({
    mutationFn: (data: any) => blingAction('criar_conta_receber', { data }),
    onSuccess: () => { toast.success('Conta a receber criada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const criarContaPagar = useMutation({
    mutationFn: (data: any) => blingAction('criar_conta_pagar', { data }),
    onSuccess: () => { toast.success('Conta a pagar criada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const darBaixaReceber = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blingAction('baixa_conta_receber', { id, data }),
    onSuccess: () => { toast.success('Baixa registrada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const darBaixaPagar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => blingAction('baixa_conta_pagar', { id, data }),
    onSuccess: () => { toast.success('Baixa registrada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const estornarBaixaReceber = useMutation({
    mutationFn: ({ id, baixaId }: { id: string; baixaId: string }) => blingAction('estornar_baixa_receber', { id, baixaId }),
    onSuccess: () => { toast.success('Baixa estornada'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const estornarBaixaPagar = useMutation({
    mutationFn: ({ id, baixaId }: { id: string; baixaId: string }) => blingAction('estornar_baixa_pagar', { id, baixaId }),
    onSuccess: () => { toast.success('Baixa estornada'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const excluirContaReceber = useMutation({
    mutationFn: (id: string) => blingAction('excluir_conta_receber', { id }),
    onSuccess: () => { toast.success('Conta excluída'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const excluirContaPagar = useMutation({
    mutationFn: (id: string) => blingAction('excluir_conta_pagar', { id }),
    onSuccess: () => { toast.success('Conta excluída'); queryClient.invalidateQueries({ queryKey: ['bling-financeiro'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarContaReceber, criarContaPagar, darBaixaReceber, darBaixaPagar, estornarBaixaReceber, estornarBaixaPagar, excluirContaReceber, excluirContaPagar };
}

// Borderôs
export function useBlingBorderos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-borderos', filtros],
    queryFn: () => blingAction('listar_borderos', { filtros }),
    enabled: false,
  });
}

// Contas Contábeis (Portadores)
export function useBlingContasContabeis() {
  return useQuery({
    queryKey: ['bling-contas-contabeis'],
    queryFn: () => blingAction('listar_contas_contabeis'),
    enabled: false,
  });
}

// Formas de Pagamento
export function useBlingFormasPagamento() {
  return useQuery({
    queryKey: ['bling-formas-pagamento'],
    queryFn: () => blingAction('formas_pagamento'),
    enabled: false,
  });
}

// Categorias Receitas/Despesas
export function useBlingCategoriasFinanceiras() {
  return useQuery({
    queryKey: ['bling-categorias-financeiras'],
    queryFn: () => blingAction('categorias_receitas_despesas'),
    enabled: false,
  });
}

// ═══════════════ NF-e ═══════════════
export function useBlingNFe(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-nfe', filtros],
    queryFn: () => blingAction('listar_nfe', { filtros: { limite: 100, ...filtros } }),
    enabled: false,
  });
}

export function useBlingNFeDetail(id?: string) {
  return useQuery({
    queryKey: ['bling-nfe-detail', id],
    queryFn: () => blingAction('buscar_nfe', { id }),
    enabled: !!id,
  });
}

export function useBlingNFeMutations() {
  const queryClient = useQueryClient();

  const criarNFe = useMutation({
    mutationFn: (data: any) => blingAction('criar_nfe', { data }),
    onSuccess: () => { toast.success('NF-e criada no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-nfe'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const enviarSefaz = useMutation({
    mutationFn: ({ id, enviarEmail }: { id: string; enviarEmail?: boolean }) => blingAction('enviar_nfe_sefaz', { id, enviarEmail }),
    onSuccess: () => { toast.success('NF-e enviada ao SEFAZ'); queryClient.invalidateQueries({ queryKey: ['bling-nfe'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const cancelarNFe = useMutation({
    mutationFn: (ids: string[]) => blingAction('cancelar_nfe', { ids }),
    onSuccess: () => { toast.success('NF-e cancelada'); queryClient.invalidateQueries({ queryKey: ['bling-nfe'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const lancarEstoqueNFe = useMutation({
    mutationFn: (id: string) => blingAction('lancar_estoque_nfe', { id }),
    onSuccess: () => toast.success('Estoque lançado da NF-e'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const lancarContasNFe = useMutation({
    mutationFn: (id: string) => blingAction('lancar_contas_nfe', { id }),
    onSuccess: () => toast.success('Contas lançadas da NF-e'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const estornarEstoqueNFe = useMutation({
    mutationFn: (id: string) => blingAction('estornar_estoque_nfe', { id }),
    onSuccess: () => toast.success('Estoque estornado da NF-e'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const estornarContasNFe = useMutation({
    mutationFn: (id: string) => blingAction('estornar_contas_nfe', { id }),
    onSuccess: () => toast.success('Contas estornadas da NF-e'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarNFe, enviarSefaz, cancelarNFe, lancarEstoqueNFe, lancarContasNFe, estornarEstoqueNFe, estornarContasNFe };
}

// ═══════════════ LOGÍSTICA ═══════════════
export function useBlingLogisticas() {
  return useQuery({
    queryKey: ['bling-logisticas'],
    queryFn: () => blingAction('listar_logisticas'),
    enabled: false,
  });
}

export function useBlingServicosLogistica() {
  return useQuery({
    queryKey: ['bling-servicos-logistica'],
    queryFn: () => blingAction('listar_servicos_logistica'),
    enabled: false,
  });
}

export function useBlingRemessas(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-remessas', filtros],
    queryFn: () => blingAction('listar_remessas', { filtros }),
    enabled: false,
  });
}

export function useBlingObjetos(filtros?: Record<string, any>) {
  return useQuery({
    queryKey: ['bling-objetos', filtros],
    queryFn: () => blingAction('listar_objetos', { filtros }),
    enabled: false,
  });
}

export function useBlingLogisticaMutations() {
  const queryClient = useQueryClient();

  const criarRemessa = useMutation({
    mutationFn: (data: any) => blingAction('criar_remessa', { data }),
    onSuccess: () => { toast.success('Remessa criada'); queryClient.invalidateQueries({ queryKey: ['bling-remessas'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const gerarEtiqueta = useMutation({
    mutationFn: (data: any) => blingAction('gerar_etiqueta', { data }),
    onSuccess: () => toast.success('Etiqueta gerada'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const rastrearObjeto = useMutation({
    mutationFn: (codigo: string) => blingAction('rastrear_objeto', { codigo }),
    onSuccess: () => toast.success('Rastreamento atualizado'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarRemessa, gerarEtiqueta, rastrearObjeto };
}

// ═══════════════ Sync Logs ═══════════════
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

// ═══════════════ Webhook Events ═══════════════
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
