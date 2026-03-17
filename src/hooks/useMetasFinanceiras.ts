import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useMetasFinanceiras(ano?: number, mes?: number) {
  return useQuery({
    queryKey: ['metas-financeiras', ano, mes],
    queryFn: async () => {
      let query = supabase.from('metas_financeiras').select('*').eq('ativo', true).order('ano', { ascending: false }).order('mes');
      if (ano) query = query.eq('ano', ano);
      if (mes) query = query.eq('mes', mes);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateMeta() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { titulo: string; tipo: string; valor_meta: number; ano: number; mes: number }) => {
      const { data, error } = await supabase.from('metas_financeiras')
        .insert({ ...input, created_by: user?.id || '' })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metas-financeiras'] }); toast.success('Meta criada!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; titulo?: string; valor_meta?: number; ativo?: boolean }) => {
      const { error } = await supabase.from('metas_financeiras').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metas-financeiras'] }); toast.success('Meta atualizada!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metas_financeiras').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metas-financeiras'] }); toast.success('Meta removida!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

// ============================================
// HISTÓRICO SCORE SAÚDE
// ============================================
export function useHistoricoScoreSaude() {
  return useQuery({
    queryKey: ['historico-score-saude'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_score_saude' as never)
        .select('*')
        .order('data_calculo', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as Array<{ id: string; score: number; data_calculo: string; detalhes: unknown; created_at: string }>;
    },
  });
}

// ============================================
// RECOMENDAÇÕES IA
// ============================================
export function useRecomendacoesIA() {
  return useQuery({
    queryKey: ['recomendacoes-metas-ia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recomendacoes_metas_ia')
        .select('*')
        .eq('aplicada', false)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
}
