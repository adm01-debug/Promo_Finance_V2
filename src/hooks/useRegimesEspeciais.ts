import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useRegimesEspeciaisEmpresa(empresaId?: string) {
  return useQuery({
    queryKey: ['regimes-especiais-empresa', empresaId],
    queryFn: async () => {
      let query = supabase.from('regimes_especiais_empresa').select('*').order('created_at', { ascending: false });
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

export function useUpdateRegimeEspecial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; ativo?: boolean; reducao_aliquota?: number }) => {
      const { error } = await supabase.from('regimes_especiais_empresa').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regimes-especiais-empresa'] });
      toast.success('Regime especial atualizado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
