import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useProtestos(empresaId?: string) {
  return useQuery({
    queryKey: ['protestos', empresaId],
    queryFn: async () => {
      let query = supabase.from('protestos').select('*').order('created_at', { ascending: false });
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateProtesto() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      valor: number; cliente_id?: string; conta_receber_id?: string; empresa_id?: string;
      cartorio?: string; cidade_cartorio?: string; estado_cartorio?: string; observacoes?: string;
    }) => {
      const { data, error } = await supabase.from('protestos')
        .insert({ ...input, created_by: user?.id || '', status: 'pendente' })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['protestos'] }); toast.success('Protesto registrado!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateProtesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; protocolo?: string; data_protocolo?: string; data_protesto?: string; data_pagamento?: string; custas?: number; observacoes?: string }) => {
      const { error } = await supabase.from('protestos').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['protestos'] }); toast.success('Protesto atualizado!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
