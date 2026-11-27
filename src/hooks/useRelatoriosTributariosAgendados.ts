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

/**
 * Primeiro envio do agendamento.
 *
 * A coluna nasce com `DEFAULT now()` (migration 20260418132402) e o job horario
 * `enviar-relatorios-tributarios` processa tudo que esta com
 * `proximo_envio_em <= now()`. Sem calcular aqui, todo agendamento era enviado
 * no minuto da criacao e o `dia_envio` escolhido so passava a valer do segundo
 * envio em diante (a edge reprograma com a mesma regra:
 * supabase/functions/enviar-relatorios-tributarios-agendados/index.ts:23 —
 * dia limitado a 28, 06:00 UTC).
 */
export function proximoEnvioInicial(
  frequencia: 'mensal' | 'trimestral' | 'anual',
  dia: number
): string {
  const proximo = new Date();
  proximo.setUTCHours(6, 0, 0, 0);
  proximo.setUTCDate(Math.min(dia, 28));
  if (proximo.getTime() <= Date.now()) {
    if (frequencia === 'mensal') proximo.setUTCMonth(proximo.getUTCMonth() + 1);
    else if (frequencia === 'trimestral') proximo.setUTCMonth(proximo.getUTCMonth() + 3);
    else proximo.setUTCFullYear(proximo.getUTCFullYear() + 1);
  }
  return proximo.toISOString();
}

export function useRelatoriosTributariosAgendados(empresaId?: string) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['relatorios-tributarios-agendados', empresaId],
    queryFn: async () => {
      let q = supabase
        .from('relatorios_tributarios_agendados' as never)
        .select('*')
        .order('created_at', { ascending: false });
      if (empresaId) q = q.eq('empresa_id' as never, empresaId as never);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as RelatorioTributarioAgendado[];
    },
    enabled: !!empresaId,
  });

  const create = useMutation({
    mutationFn: async (input: CreateAgendamentoInput) => {
      const { data, error } = await supabase
        .from('relatorios_tributarios_agendados' as never)
        .insert({
          ...input,
          proximo_envio_em: proximoEnvioInicial(input.frequencia, input.dia_envio),
        } as never)
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
        .from('relatorios_tributarios_agendados' as never)
        .update({ ativo } as never)
        .eq('id' as never, id as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relatorios-tributarios-agendados'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('relatorios_tributarios_agendados' as never)
        .delete()
        .eq('id' as never, id as never);
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
