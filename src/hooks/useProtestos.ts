import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  return useMutation({
    mutationFn: async (input: {
      valor: number;
      cliente_id?: string;
      conta_receber_id?: string;
      empresa_id?: string;
      cartorio?: string;
      cidade_cartorio?: string;
      estado_cartorio?: string;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from('protestos')
        // TODO(2026-08-14): observacoes/created_by removidos — não existem em protestos (types.ts)
        .insert({
          valor: input.valor,
          cliente_id: input.cliente_id,
          conta_receber_id: input.conta_receber_id,
          empresa_id: input.empresa_id,
          cartorio: input.cartorio,
          cidade_cartorio: input.cidade_cartorio,
          estado_cartorio: input.estado_cartorio,
          status: 'pendente',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['protestos'] });
      toast.success('Protesto registrado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateProtesto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      protocolo?: string;
      data_protocolo?: string;
      data_protesto?: string;
      data_pagamento?: string;
      custas?: number;
      observacoes?: string;
    }) => {
      const { error } = await supabase
        .from('protestos')
        // TODO(2026-08-14): data_protocolo→data_protesto (renomeada); data_pagamento/observacoes removidos (não existem no schema)
        // TODO(2026-08-14): protocolo→numero_protesto (nome canônico em protestos)
        .update({
          status: data.status,
          numero_protesto: data.protocolo,
          data_protesto: data.data_protocolo ?? data.data_protesto,
          custas: data.custas,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['protestos'] });
      toast.success('Protesto atualizado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
