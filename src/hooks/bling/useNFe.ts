import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { blingAction } from './client';
import { estornarCreditosCancelados, guardarXmlAutorizado } from '@/hooks/useBlingNFe';

export function useBlingNFe(filtros?: Record<string, unknown>) {
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
    mutationFn: (data: Record<string, unknown>) => blingAction('criar_nfe', { data }),
    onSuccess: () => {
      toast.success('NF-e criada no Bling');
      queryClient.invalidateQueries({ queryKey: ['bling-nfe'] });
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const enviarSefaz = useMutation({
    mutationFn: ({ id, enviarEmail }: { id: string; enviarEmail?: boolean }) =>
      blingAction('enviar_nfe_sefaz', { id, enviarEmail }),
    onSuccess: (_data, variables) => {
      toast.success('NF-e enviada ao SEFAZ');
      queryClient.invalidateQueries({ queryKey: ['bling-nfe'] });
      // Sem isso a nota autorizada por esta tela não gerava crédito IBS/CBS:
      // o XML só era arquivado pelo outro hook do Bling.
      void guardarXmlAutorizado(Number(variables.id)).catch(() => undefined);
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const cancelarNFe = useMutation({
    mutationFn: (ids: string[]) => blingAction('cancelar_nfe', { ids }),
    onSuccess: async (_data, ids) => {
      toast.success('NF-e cancelada');
      queryClient.invalidateQueries({ queryKey: ['bling-nfe'] });
      // Cancelamento precisa invalidar o crédito destacado (etapa 58).
      await estornarCreditosCancelados(ids.map((id) => Number(id)));
    },
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

  return {
    criarNFe,
    enviarSefaz,
    cancelarNFe,
    lancarEstoqueNFe,
    lancarContasNFe,
    estornarEstoqueNFe,
    estornarContasNFe,
  };
}
