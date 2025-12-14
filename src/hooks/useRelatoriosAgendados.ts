import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface RelatorioAgendado {
  id: string;
  nome: string;
  tipo_relatorio: string;
  frequencia: string;
  dia_semana: number | null;
  dia_mes: number | null;
  hora_execucao: string;
  empresa_id: string | null;
  centro_custo_id: string | null;
  ativo: boolean;
  ultimo_envio: string | null;
  proximo_envio: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricoRelatorio {
  id: string;
  relatorio_agendado_id: string;
  status: string;
  dados_relatorio: Record<string, unknown> | null;
  erro_mensagem: string | null;
  executado_em: string;
}

export interface CreateRelatorioInput {
  nome: string;
  tipo_relatorio: string;
  frequencia: string;
  dia_semana?: number | null;
  dia_mes?: number | null;
  hora_execucao: string;
  empresa_id?: string | null;
  centro_custo_id?: string | null;
}

export function useRelatoriosAgendados() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: relatorios = [], isLoading } = useQuery({
    queryKey: ['relatorios-agendados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relatorios_agendados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RelatorioAgendado[];
    },
    enabled: !!user,
  });

  const { data: historico = [] } = useQuery({
    queryKey: ['historico-relatorios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_relatorios')
        .select('*')
        .order('executado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as HistoricoRelatorio[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateRelatorioInput) => {
      if (!user) throw new Error('Usuário não autenticado');

      const proximoEnvio = calcularProximoEnvio(
        input.frequencia,
        input.hora_execucao,
        input.dia_semana,
        input.dia_mes
      );

      const { data, error } = await supabase
        .from('relatorios_agendados')
        .insert({
          ...input,
          created_by: user.id,
          proximo_envio: proximoEnvio,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorios-agendados'] });
      toast({
        title: 'Relatório agendado',
        description: 'O relatório foi configurado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao agendar relatório',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<RelatorioAgendado> & { id: string }) => {
      const { data, error } = await supabase
        .from('relatorios_agendados')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorios-agendados'] });
      toast({
        title: 'Relatório atualizado',
        description: 'As configurações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('relatorios_agendados')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relatorios-agendados'] });
      toast({
        title: 'Relatório removido',
        description: 'O agendamento foi excluído.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('relatorios_agendados')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: ['relatorios-agendados'] });
      toast({
        title: ativo ? 'Relatório ativado' : 'Relatório pausado',
        description: ativo 
          ? 'O agendamento foi reativado.' 
          : 'O agendamento foi pausado.',
      });
    },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['relatorios-agendados'] });
    queryClient.invalidateQueries({ queryKey: ['historico-relatorios'] });
  };

  return {
    relatorios,
    historico,
    isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    toggleAtivo: toggleAtivo.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    refetch,
  };
}

function calcularProximoEnvio(
  frequencia: string,
  hora: string,
  diaSemana: number | null | undefined,
  diaMes: number | null | undefined
): string {
  const agora = new Date();
  const [horas, minutos] = hora.split(':').map(Number);
  
  let proximo = new Date(agora);
  proximo.setHours(horas, minutos, 0, 0);

  if (proximo <= agora) {
    switch (frequencia) {
      case 'diario':
        proximo.setDate(proximo.getDate() + 1);
        break;
      case 'semanal':
        proximo.setDate(proximo.getDate() + 7);
        break;
      case 'mensal':
        proximo.setMonth(proximo.getMonth() + 1);
        break;
    }
  }

  if (frequencia === 'semanal' && diaSemana !== null && diaSemana !== undefined) {
    const diaAtual = proximo.getDay();
    const diff = (diaSemana - diaAtual + 7) % 7;
    proximo.setDate(proximo.getDate() + (diff === 0 && proximo <= agora ? 7 : diff));
  }

  if (frequencia === 'mensal' && diaMes !== null && diaMes !== undefined) {
    proximo.setDate(diaMes);
    if (proximo <= agora) {
      proximo.setMonth(proximo.getMonth() + 1);
    }
  }

  return proximo.toISOString();
}
