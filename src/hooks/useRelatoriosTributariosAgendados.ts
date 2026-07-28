import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RelatorioTributarioAgendado {
  id: string;
  empresa_id: string;
  ano: number;
  frequencia: 'mensal' | 'trimestral' | 'anual';
  dia_envio: number;
  destinatarios: string[];
  ativo: boolean;
  ultimo_envio_em: string | null;
  proximo_envio_em: string;
  created_at: string;
}

export interface CreateAgendamentoInput {
  empresa_id: string;
  ano: number;
  frequencia: 'mensal' | 'trimestral' | 'anual';
  dia_envio: number;
  destinatarios: string[];
}

export function useRelatoriosTributariosAgendados(empresaId?: string) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['relatorios-tributarios-agendados', empresaId],
    queryFn: async () => {
      let q = supabase
        .from('relatorios_tributarios_agendados')
        .select('*')
        .order('created_at', { ascending: false });
      if (empresaId) q = q.eq('empresa_id', empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as RelatorioTributarioAgendado[];
    },
    enabled: !!empresaId,
  });

  const create = useMutation({
    mutationFn: async (input: CreateAgendamentoInput) => {
      const { data, error } = await supabase
        .from('relatorios_tributarios_agendados')
        .insert(input)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Agendamento criado');
      qc.invalidateQueries({ queryKey: ['relatorios-tributarios-agendados'] });
    },
    onError: (e: Error) => toast.error('Erro ao criar agendamento', { description: e.message }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('relatorios_tributarios_agendados')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relatorios-tributarios-agendados'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('relatorios_tributarios_agendados')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agendamento removido');
      qc.invalidateQueries({ queryKey: ['relatorios-tributarios-agendados'] });
    },
  });

  return {
    agendamentos: list.data ?? [],
    isLoading: list.isLoading,
    create: create.mutate,
    isCreating: create.isPending,
    toggle: toggle.mutate,
    remove: remove.mutate,
  };
}
