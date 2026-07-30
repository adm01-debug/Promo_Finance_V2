import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blingAction } from './client';

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
    mutationFn: (data: Record<string, unknown>) => blingAction('lancar_estoque', { data }),
    onSuccess: () => { toast.success('Movimentação de estoque lançada'); queryClient.invalidateQueries({ queryKey: ['bling-estoque'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const criarDeposito = useMutation({
    mutationFn: (data: Record<string, unknown>) => blingAction('criar_deposito', { data }),
    onSuccess: () => { toast.success('Depósito criado'); queryClient.invalidateQueries({ queryKey: ['bling-depositos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { lancarEstoque, criarDeposito };
}
