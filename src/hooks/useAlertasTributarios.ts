// ============================================
// HOOK: ALERTAS TRIBUTÁRIOS EM TEMPO REAL
// Monitoramento de prazos e compliance
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';

export type TipoAlerta = 
  | 'vencimento_apuracao' 
  | 'vencimento_darf' 
  | 'vencimento_obrigacao'
  | 'prazo_credito' 
  | 'limite_compensacao' 
  | 'pendencia_conciliacao'
  | 'inconsistencia_fiscal' 
  | 'atualizacao_legislacao' 
  | 'split_payment'
  | 'retencao_pendente' 
  | 'nfe_rejeitada' 
  | 'saldo_negativo';

export type PrioridadeAlerta = 'baixa' | 'media' | 'alta' | 'critica';

export interface AlertaTributario {
  id: string;
  empresa_id?: string;
  user_id?: string;
  tipo: TipoAlerta;
  titulo: string;
  mensagem: string;
  prioridade: PrioridadeAlerta;
  data_vencimento?: string;
  data_lembrete?: string;
  entidade_tipo?: string;
  entidade_id?: string;
  competencia?: string;
  lido: boolean;
  resolvido: boolean;
  resolvido_em?: string;
  resolvido_por?: string;
  acao_url?: string;
  acao_label?: string;
  created_at: string;
}

// Ícones e cores por tipo
export const ALERTA_CONFIG: Record<TipoAlerta, { 
  icone: string; 
  cor: string; 
  label: string;
}> = {
  vencimento_apuracao: { icone: 'Calculator', cor: 'blue', label: 'Apuração' },
  vencimento_darf: { icone: 'FileText', cor: 'red', label: 'DARF' },
  vencimento_obrigacao: { icone: 'FileCheck', cor: 'orange', label: 'Obrigação' },
  prazo_credito: { icone: 'Clock', cor: 'yellow', label: 'Crédito' },
  limite_compensacao: { icone: 'Scale', cor: 'purple', label: 'Compensação' },
  pendencia_conciliacao: { icone: 'ArrowLeftRight', cor: 'amber', label: 'Conciliação' },
  inconsistencia_fiscal: { icone: 'AlertTriangle', cor: 'red', label: 'Inconsistência' },
  atualizacao_legislacao: { icone: 'BookOpen', cor: 'green', label: 'Legislação' },
  split_payment: { icone: 'CreditCard', cor: 'indigo', label: 'Split Payment' },
  retencao_pendente: { icone: 'Receipt', cor: 'orange', label: 'Retenção' },
  nfe_rejeitada: { icone: 'FileX', cor: 'red', label: 'NF-e Rejeitada' },
  saldo_negativo: { icone: 'TrendingDown', cor: 'red', label: 'Saldo Negativo' },
};

export function useAlertasTributarios(empresaId?: string) {
  const queryClient = useQueryClient();
  const [alertasRealtime, setAlertasRealtime] = useState<AlertaTributario[]>([]);

  // Buscar alertas do banco
  const { data: alertas = [], isLoading, refetch } = useQuery({
    queryKey: ['alertas-tributarios', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('alertas_tributarios')
        .select('*')
        .eq('resolvido', false)
        .order('prioridade', { ascending: false })
        .order('data_vencimento', { ascending: true });

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AlertaTributario[];
    },
  });

  // Configurar listener realtime
  useEffect(() => {
    const channel = supabase
      .channel('alertas-tributarios-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertas_tributarios',
        },
        (payload) => {
          const novoAlerta = payload.new as AlertaTributario;
          
          // Notificar usuário
          const config = ALERTA_CONFIG[novoAlerta.tipo];
          toast[novoAlerta.prioridade === 'critica' ? 'error' : 'warning'](
            novoAlerta.titulo,
            { description: novoAlerta.mensagem }
          );

          // Atualizar lista
          setAlertasRealtime(prev => [novoAlerta, ...prev]);
          queryClient.invalidateQueries({ queryKey: ['alertas-tributarios'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alertas_tributarios',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alertas-tributarios'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Criar alerta
  const criarAlerta = useMutation({
    mutationFn: async (alerta: Omit<AlertaTributario, 'id' | 'created_at' | 'lido' | 'resolvido'>) => {
      const { data, error } = await supabase
        .from('alertas_tributarios')
        .insert({
          ...alerta,
          lido: false,
          resolvido: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-tributarios'] });
    },
  });

  // Marcar como lido
  const marcarLido = useMutation({
    mutationFn: async (alertaId: string) => {
      const { error } = await supabase
        .from('alertas_tributarios')
        .update({ lido: true })
        .eq('id', alertaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-tributarios'] });
    },
  });

  // Resolver alerta
  const resolverAlerta = useMutation({
    mutationFn: async ({ alertaId, userId }: { alertaId: string; userId?: string }) => {
      const { error } = await supabase
        .from('alertas_tributarios')
        .update({ 
          resolvido: true,
          resolvido_em: new Date().toISOString(),
          resolvido_por: userId,
        })
        .eq('id', alertaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas-tributarios'] });
      toast.success('Alerta resolvido');
    },
  });

  // Gerar alertas automáticos baseado em dados do sistema
  const gerarAlertasAutomaticos = useCallback(async (empresaId: string) => {
    const hoje = new Date();
    const alertasParaCriar: Omit<AlertaTributario, 'id' | 'created_at' | 'lido' | 'resolvido'>[] = [];

    // Verificar DARFs pendentes
    const { data: darfsPendentes } = await supabase
      .from('darfs')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', 'gerado');

    darfsPendentes?.forEach(darf => {
      const diasParaVencer = differenceInDays(parseISO(darf.data_vencimento), hoje);
      
      if (diasParaVencer <= 3 && diasParaVencer >= 0) {
        alertasParaCriar.push({
          empresa_id: empresaId,
          tipo: 'vencimento_darf',
          titulo: `DARF ${darf.codigo_receita} vence em ${diasParaVencer} dias`,
          mensagem: `DARF de ${darf.descricao_receita} no valor de R$ ${darf.valor_total.toFixed(2)} vence em ${format(parseISO(darf.data_vencimento), 'dd/MM/yyyy')}`,
          prioridade: diasParaVencer === 0 ? 'critica' : diasParaVencer === 1 ? 'alta' : 'media',
          data_vencimento: darf.data_vencimento,
          entidade_tipo: 'darf',
          entidade_id: darf.id,
          acao_url: '/reforma-tributaria?tab=retencoes',
          acao_label: 'Ver DARF',
        });
      }
    });

    // Verificar retenções pendentes
    const { data: retencoesPendentes } = await supabase
      .from('retencoes_fonte')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', 'pendente')
      .eq('darf_gerado', false);

    if (retencoesPendentes && retencoesPendentes.length > 5) {
      alertasParaCriar.push({
        empresa_id: empresaId,
        tipo: 'retencao_pendente',
        titulo: `${retencoesPendentes.length} retenções aguardando DARF`,
        mensagem: `Existem ${retencoesPendentes.length} retenções pendentes sem DARF gerado. Consolide e gere os DARFs.`,
        prioridade: 'media',
        acao_url: '/reforma-tributaria?tab=retencoes',
        acao_label: 'Gerenciar Retenções',
      });
    }

    // Verificar créditos próximos de expirar
    const { data: creditos } = await supabase
      .from('creditos_tributarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', 'disponivel');

    // Créditos com mais de 5 anos podem expirar
    creditos?.forEach(credito => {
      const dataOrigem = parseISO(credito.data_origem);
      const diasDesdeOrigem = differenceInDays(hoje, dataOrigem);
      const diasParaExpirar = (5 * 365) - diasDesdeOrigem; // 5 anos para expirar

      if (diasParaExpirar <= 90 && diasParaExpirar > 0) {
        alertasParaCriar.push({
          empresa_id: empresaId,
          tipo: 'prazo_credito',
          titulo: `Crédito ${credito.tipo_tributo} expira em ${diasParaExpirar} dias`,
          mensagem: `Crédito tributário de R$ ${credito.saldo_disponivel?.toFixed(2)} está próximo de expirar. Utilize antes do vencimento.`,
          prioridade: diasParaExpirar <= 30 ? 'alta' : 'media',
          entidade_tipo: 'credito',
          entidade_id: credito.id,
          competencia: credito.competencia_origem,
          acao_url: '/reforma-tributaria?tab=creditos',
          acao_label: 'Ver Créditos',
        });
      }
    });

    // Criar alertas em batch
    if (alertasParaCriar.length > 0) {
      for (const alerta of alertasParaCriar) {
        await criarAlerta.mutateAsync(alerta);
      }
    }

    return alertasParaCriar.length;
  }, [criarAlerta]);

  // Contadores
  const naoLidos = alertas.filter(a => !a.lido).length;
  const criticos = alertas.filter(a => a.prioridade === 'critica').length;
  const porTipo = alertas.reduce((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] || 0) + 1;
    return acc;
  }, {} as Record<TipoAlerta, number>);

  // Próximos vencimentos
  const proximosVencimentos = alertas
    .filter(a => a.data_vencimento)
    .sort((a, b) => new Date(a.data_vencimento!).getTime() - new Date(b.data_vencimento!).getTime())
    .slice(0, 5);

  return {
    alertas: [...alertasRealtime, ...alertas.filter(a => !alertasRealtime.find(r => r.id === a.id))],
    isLoading,
    naoLidos,
    criticos,
    porTipo,
    proximosVencimentos,
    criarAlerta,
    marcarLido,
    resolverAlerta,
    gerarAlertasAutomaticos,
    refetch,
    ALERTA_CONFIG,
  };
}

export default useAlertasTributarios;
