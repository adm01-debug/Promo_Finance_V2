import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  return useMutation({
    mutationFn: async (input: {
      descricao: string;
      tipo: string;
      data_inicio: string;
      data_fim?: string;
      valor_mensal?: number;
      valor_total?: number;
      cliente_id?: string;
      fornecedor_id?: string;
      empresa_id?: string;
      renovacao_automatica?: boolean;
      dias_aviso_renovacao?: number;
      numero_contrato?: string;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from('contratos')
        // TODO(2026-08-14): campos de input fora do schema canônico não são enviados:
        // cliente_id, fornecedor_id, dias_aviso_renovacao, observacoes, created_by
        .insert({
          descricao: input.descricao,
          tipo: input.tipo,
          data_inicio: input.data_inicio,
          data_fim: input.data_fim,
          valor_mensal: input.valor_mensal,
          valor_total: input.valor_total,
          empresa_id: input.empresa_id,
          renovacao_automatica: input.renovacao_automatica,
          numero_contrato: input.numero_contrato,
          status: 'ativo',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato criado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      descricao?: string;
      tipo?: string;
      data_inicio?: string;
      data_fim?: string;
      valor_mensal?: number;
      valor_total?: number;
      empresa_id?: string;
      renovacao_automatica?: boolean;
      numero_contrato?: string;
      status?: string;
    }) => {
      // TODO(2026-08-14): assinatura estreitada para as colunas canônicas de contratos (types.ts)
      const { error } = await supabase.from('contratos').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato atualizado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contratos')
        .update({ status: 'cancelado' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato cancelado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
