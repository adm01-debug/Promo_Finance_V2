import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type PrioridadeAlerta = 'baixa' | 'media' | 'alta' | 'critica';

export interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  prioridade: PrioridadeAlerta;
  lido: boolean;
  entidade_tipo: string | null;
  entidade_id: string | null;
  acao_url: string | null;
  user_id: string | null;
  created_at: string;
}

export function useAlertas() {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: async (): Promise<Alerta[]> => {
      const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((alerta) => ({
        id: alerta.id,
        tipo: alerta.tipo,
        titulo: alerta.titulo,
        mensagem: alerta.mensagem,
        prioridade: alerta.prioridade as PrioridadeAlerta,
        lido: alerta.lido,
        entidade_tipo: alerta.entidade_tipo,
        entidade_id: alerta.entidade_id,
        acao_url: alerta.acao_url,
        user_id: alerta.user_id,
        created_at: alerta.created_at,
      }));
    },
  });
}

export function useAlertasNaoLidos() {
  return useQuery({
    queryKey: ['alertas-nao-lidos-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .eq('lido', false);

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useMarcarAlertaComoLido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertaId: string) => {
      const { error } = await supabase
        .from('alertas')
        .update({ lido: true })
        .eq('id', alertaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-nao-lidos-count'] });
    },
    onError: (error) => {
      logger.error('[useAlertas] Erro ao marcar alerta como lido:', error);
      toast.error('Erro ao marcar alerta como lido');
    },
  });
}

export function useMarcarTodosAlertasComoLidos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('alertas')
        .update({ lido: true })
        .eq('lido', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-nao-lidos-count'] });
      toast.success('Todos alertas marcados como lidos');
    },
    onError: (error) => {
      logger.error('[useAlertas] Erro ao marcar alertas como lidos:', error);
      toast.error('Erro ao marcar alertas como lidos');
    },
  });
}

export function useCriarAlerta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alerta: {
      tipo: string;
      titulo: string;
      mensagem: string;
      prioridade?: PrioridadeAlerta;
      entidade_tipo?: string;
      entidade_id?: string;
      acao_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('alertas')
        .insert({
          tipo: alerta.tipo,
          titulo: alerta.titulo,
          mensagem: alerta.mensagem,
          prioridade: alerta.prioridade || 'media',
          entidade_tipo: alerta.entidade_tipo,
          entidade_id: alerta.entidade_id,
          acao_url: alerta.acao_url,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-nao-lidos-count'] });
    },
    onError: (error) => {
      logger.error('[useAlertas] Erro ao criar alerta:', error);
      toast.error('Erro ao criar alerta');
    },
  });
}

// Função utilitária para gerar alertas automáticos baseados em regras de negócio
export async function gerarAlertasAutomaticos() {
  const hoje = new Date().toISOString().split('T')[0];
  const emTresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Buscar contas a pagar próximas do vencimento
  const { data: contasPagar } = await supabase
    .from('contas_pagar')
    .select('id, descricao, valor, data_vencimento, fornecedor_nome')
    .lte('data_vencimento', emTresDias)
    .gte('data_vencimento', hoje)
    .eq('status', 'pendente');

  // Buscar contas a receber vencidas
  const { data: contasVencidas } = await supabase
    .from('contas_receber')
    .select('id, descricao, valor, data_vencimento, cliente_nome')
    .lt('data_vencimento', hoje)
    .in('status', ['pendente', 'vencido']);

  return {
    contasProximasVencimento: contasPagar || [],
    contasVencidas: contasVencidas || [],
  };
}
