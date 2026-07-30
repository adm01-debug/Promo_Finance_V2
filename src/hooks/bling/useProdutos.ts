import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blingAction } from './client';

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
    mutationFn: (data: Record<string, unknown>) => blingAction('criar_produto', { data }),
    onSuccess: () => { toast.success('Produto criado no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-produtos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const atualizarProduto = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => blingAction('atualizar_produto', { id, data }),
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
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => blingAction('criar_variacoes', { id, data }),
    onSuccess: () => { toast.success('Variações criadas'); queryClient.invalidateQueries({ queryKey: ['bling-variacoes'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const gerarCombinacoes = useMutation({
    mutationFn: (data: Record<string, unknown>) => blingAction('gerar_combinacoes', { data }),
    onSuccess: () => toast.success('Combinações geradas'),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarVariacoes, gerarCombinacoes };
}
