// Hook para vínculo financeiro NFe recebida ↔ contas_pagar.
// Chama proxy Edge Function `nfe-vinculo-proxy` (service_role) em vez de RPCs diretas.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invokeEdge, handleEdgeError } from '@/lib/edge-function-error';

export interface SugestaoContaPagar {
  conta_pagar_id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  fornecedor_cnpj: string | null;
  fornecedor_nome: string | null;
  score: number;
  match_motivo: string | null;
}

function invokeNfeProxy<T>(body: Record<string, unknown>): Promise<T> {
  return invokeEdge<T>('nfe-vinculo-proxy', body);
}

export function useSugestoesContaPagar(nfeId: string | null) {
  return useQuery({
    queryKey: ['nfe-sugestoes-cp', nfeId],
    enabled: !!nfeId,
    staleTime: 30_000,
    queryFn: async (): Promise<SugestaoContaPagar[]> => {
      const data = await invokeNfeProxy<SugestaoContaPagar[] | null>({
        action: 'suggest',
        nfeId,
      });
      return data ?? [];
    },
  });
}

type LinkResult = { ok: boolean; already_linked: boolean; conta_pagar_id: string };

export function useVincularNfe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { nfeId: string; contaPagarId: string }) =>
      invokeNfeProxy<LinkResult>({
        action: 'link',
        nfeId: v.nfeId,
        contaPagarId: v.contaPagarId,
      }),
    onSuccess: (data) => {
      toast.success(data.already_linked ? 'NFe já estava vinculada.' : 'NFe vinculada à conta a pagar.');
      qc.invalidateQueries({ queryKey: ['nfe-recebidas'] });
      qc.invalidateQueries({ queryKey: ['contas-pagar'] });
    },
    onError: (err) => handleEdgeError(err, 'Falha ao vincular NFe'),
  });
}

export function useDesvincularNfe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nfeId: string) =>
      invokeNfeProxy<{ ok: boolean; conta_pagar_id: string | null }>({
        action: 'unlink',
        nfeId,
      }),
    onSuccess: () => {
      toast.success('Vínculo removido.');
      qc.invalidateQueries({ queryKey: ['nfe-recebidas'] });
    },
    onError: (err) => handleEdgeError(err, 'Falha ao desvincular'),
  });
}

export function useCriarContaDaNfe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { nfeId: string; dataVencimento?: string; categoriaId?: string }) =>
      invokeNfeProxy<LinkResult>({
        action: 'create_from_nfe',
        nfeId: v.nfeId,
        dataVencimento: v.dataVencimento ?? null,
        categoriaId: v.categoriaId ?? null,
      }),
    onSuccess: (data) => {
      toast.success(
        data.already_linked ? 'NFe já possuía conta vinculada.' : 'Conta a pagar criada e vinculada à NFe.',
      );
      qc.invalidateQueries({ queryKey: ['nfe-recebidas'] });
      qc.invalidateQueries({ queryKey: ['contas-pagar'] });
    },
    onError: (err: Error) => toast.error('Falha ao criar conta a pagar', { description: err.message }),
  });
}
