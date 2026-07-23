// Hook para vínculo financeiro NFe recebida ↔ contas_pagar.
// Chama proxy Edge Function `nfe-vinculo-proxy` (service_role) em vez de RPCs diretas.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

async function invokeNfeProxy<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<{ data?: T; ok?: boolean; error?: string }>(
    'nfe-vinculo-proxy',
    { body },
  );
  if (error) throw new Error(error.message);
  if (data && 'error' in data && data.error) throw new Error(data.error);
  return (data?.data ?? (data as unknown)) as T;
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
    onError: (err: Error) => toast.error('Falha ao vincular NFe', { description: err.message }),
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
    onError: (err: Error) => toast.error('Falha ao desvincular', { description: err.message }),
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
