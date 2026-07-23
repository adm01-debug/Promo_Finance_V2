// Hook para vínculo financeiro NFe recebida ↔ contas_pagar.
// Usa RPCs atômicas e idempotentes definidas na migration da Fase 5.
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

export function useSugestoesContaPagar(nfeId: string | null) {
  return useQuery({
    queryKey: ['nfe-sugestoes-cp', nfeId],
    enabled: !!nfeId,
    staleTime: 30_000,
    queryFn: async (): Promise<SugestaoContaPagar[]> => {
      const { data, error } = await supabase.rpc('nfe_suggest_contas_pagar', { p_nfe_id: nfeId! });
      if (error) throw error;
      return (data ?? []) as SugestaoContaPagar[];
    },
  });
}

export function useVincularNfe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { nfeId: string; contaPagarId: string }) => {
      const { data, error } = await supabase.rpc('nfe_link_conta_pagar', {
        p_nfe_id: v.nfeId,
        p_conta_pagar_id: v.contaPagarId,
      });
      if (error) throw error;
      return data as { ok: boolean; already_linked: boolean; conta_pagar_id: string };
    },
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
    mutationFn: async (nfeId: string) => {
      const { data, error } = await supabase.rpc('nfe_unlink_conta_pagar', { p_nfe_id: nfeId });
      if (error) throw error;
      return data as { ok: boolean; conta_pagar_id: string | null };
    },
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
    mutationFn: async (v: { nfeId: string; dataVencimento?: string; categoriaId?: string }) => {
      const { data, error } = await supabase.rpc('nfe_create_conta_pagar_from_nfe', {
        p_nfe_id: v.nfeId,
        p_data_vencimento: v.dataVencimento ?? null,
        p_categoria_id: v.categoriaId ?? null,
      });
      if (error) throw error;
      return data as { ok: boolean; already_linked: boolean; conta_pagar_id: string };
    },
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
