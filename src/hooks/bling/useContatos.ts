import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blingAction } from './client';

export function useBlingContatos(filtros?: Record<string, unknown>) {
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
    mutationFn: (data: Record<string, unknown>) => blingAction('criar_contato', { data }),
    onSuccess: () => { toast.success('Contato criado no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-contatos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const atualizarContato = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => blingAction('atualizar_contato', { id, data }),
    onSuccess: () => { toast.success('Contato atualizado no Bling'); queryClient.invalidateQueries({ queryKey: ['bling-contatos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const excluirContatos = useMutation({
    mutationFn: (ids: string[]) => blingAction('excluir_contatos', { ids }),
    onSuccess: () => { toast.success('Contato(s) excluído(s)'); queryClient.invalidateQueries({ queryKey: ['bling-contatos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const alterarSituacaoContato = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => blingAction('alterar_situacao_contato', { id, data }),
    onSuccess: () => { toast.success('Situação alterada'); queryClient.invalidateQueries({ queryKey: ['bling-contatos'] }); },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return { criarContato, atualizarContato, excluirContatos, alterarSituacaoContato };
}
