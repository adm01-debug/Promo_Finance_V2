import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
export function useNegativacoes(empresaId?: string) {
  return useQuery({
    queryKey: ['negativacoes', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('negativacoes')
        .select('*')
        .order('created_at', { ascending: false });
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateNegativacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      bureau: string;
      valor: number;
      cliente_id?: string;
      conta_receber_id?: string;
      empresa_id?: string;
      motivo?: string;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from('negativacoes')
        // TODO(2026-08-14): observacoes/created_by removidos — não existem em negativacoes (types.ts)
        .insert({
          bureau: input.bureau,
          valor: input.valor,
          cliente_id: input.cliente_id,
          conta_receber_id: input.conta_receber_id,
          empresa_id: input.empresa_id,
          motivo: input.motivo,
          status: 'pendente',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['negativacoes'] });
      toast.success('Negativação registrada!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateNegativacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      protocolo?: string;
      data_inclusao?: string;
      data_exclusao?: string;
      observacoes?: string;
    }) => {
      const { error } = await supabase
        .from('negativacoes')
        // TODO(2026-08-14): data_inclusao→data_negativacao e data_exclusao→data_baixa (renomeadas); observacoes removido
        .update({
          status: data.status,
          protocolo: data.protocolo,
          data_negativacao: data.data_inclusao,
          data_baixa: data.data_exclusao,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['negativacoes'] });
      toast.success('Negativação atualizada!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
