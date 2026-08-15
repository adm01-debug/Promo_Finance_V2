import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blingAction } from './client';

export function useBlingPedidos(filtros?: Record<string, unknown>) {
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
    mutationFn: (data: Record<string, unknown>) => blingAction('criar_pedido', { data }),
    onSuccess: () => { toast.success('Pedido criado no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-pedidos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const atualizarPedido = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => blingAction('atualizar_pedido', { id, data }),
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
