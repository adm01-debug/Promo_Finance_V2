import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Divergencia {
  id: string;
  tipo_divergencia: 'saldo_final' | 'valor_parcial' | 'data_descolada';
  descricao: string;
  valor_divergencia: number;
  status: 'pendente' | 'aceito' | 'corrigido';
  recomendacao: string;
  created_at: string;
  conta_bancaria_id: string;
  transacao_id?: string;
}

export function useDivergenciasConciliacao() {
  const queryClient = useQueryClient();

  const { data: divergencias = [], isLoading } = useQuery({
    queryKey: ['divergencias-conciliacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('divergencias_conciliacao')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Divergencia[];
    }
  });

  const resolverDivergencia = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'aceito' | 'corrigido' }) => {
      const { error } = await supabase
        .from('divergencias_conciliacao')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divergencias-conciliacao'] });
      toast.success('Divergência atualizada com sucesso');
    }
  });

  return { divergencias, isLoading, resolverDivergencia };
}
