import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useContratos(empresaId?: string) {
  return useQuery({
    queryKey: ['contratos', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('contratos')
        .select('*, cliente:clientes(id, razao_social), fornecedor:fornecedores(id, razao_social)')
        .order('created_at', { ascending: false });
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateContrato() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      descricao: string; tipo: string; data_inicio: string; data_fim?: string;
      valor_mensal?: number; valor_total?: number; cliente_id?: string; fornecedor_id?: string;
      empresa_id?: string; renovacao_automatica?: boolean; dias_aviso_renovacao?: number;
      numero_contrato?: string; observacoes?: string;
    }) => {
      const { data, error } = await supabase.from('contratos')
        .insert({ ...input, created_by: user?.id || '', status: 'ativo' })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contratos'] }); toast.success('Contrato criado!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('contratos').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contratos'] }); toast.success('Contrato atualizado!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contratos').update({ status: 'cancelado' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contratos'] }); toast.success('Contrato cancelado!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
