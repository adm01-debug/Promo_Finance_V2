import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TarefaRPA {
  id: string;
  nome: string;
  tipo: 'conciliacao' | 'cobranca' | 'relatorio' | 'backup' | 'limpeza' | 'notificacao';
  descricao: string;
  cron_expression: string;
  ativo: boolean;
  ultima_execucao?: string;
  proxima_execucao?: string;
  parametros?: Record<string, unknown>;
  total_execucoes: number;
  execucoes_sucesso: number;
  execucoes_erro: number;
}

export interface ExecucaoRPA {
  id: string;
  tarefa_id: string;
  iniciado_em: string;
  finalizado_em?: string;
  status: 'executando' | 'sucesso' | 'erro' | 'cancelado';
  resultado?: Record<string, unknown>;
  erro_mensagem?: string;
  registros_processados: number;
}

// Tarefas RPA disponíveis
const tarefasDisponiveis: Omit<TarefaRPA, 'id'>[] = [
  {
    nome: 'Conciliação Automática',
    tipo: 'conciliacao',
    descricao: 'Executa conciliação bancária usando IA para matching automático',
    cron_expression: '0 6 * * *',
    ativo: false,
    total_execucoes: 0,
    execucoes_sucesso: 0,
    execucoes_erro: 0,
    parametros: { threshold_minimo: 0.8, auto_aprovar: false }
  },
  {
    nome: 'Cobrança Automática',
    tipo: 'cobranca',
    descricao: 'Envia lembretes e cobranças para títulos próximos do vencimento',
    cron_expression: '0 9 * * 1-5',
    ativo: false,
    total_execucoes: 0,
    execucoes_sucesso: 0,
    execucoes_erro: 0,
    parametros: { dias_antes: 3, canal: 'email' }
  },
  {
    nome: 'Relatório Diário',
    tipo: 'relatorio',
    descricao: 'Gera e envia relatório executivo diário automaticamente',
    cron_expression: '0 7 * * 1-5',
    ativo: false,
    total_execucoes: 0,
    execucoes_sucesso: 0,
    execucoes_erro: 0,
    parametros: { destinatarios: [], formato: 'pdf' }
  },
  {
    nome: 'Backup Financeiro',
    tipo: 'backup',
    descricao: 'Realiza backup dos dados financeiros críticos',
    cron_expression: '0 2 * * *',
    ativo: false,
    total_execucoes: 0,
    execucoes_sucesso: 0,
    execucoes_erro: 0,
    parametros: { incluir_anexos: true, retencao_dias: 30 }
  },
  {
    nome: 'Limpeza de Dados',
    tipo: 'limpeza',
    descricao: 'Remove dados temporários e otimiza armazenamento',
    cron_expression: '0 3 * * 0',
    ativo: false,
    total_execucoes: 0,
    execucoes_sucesso: 0,
    execucoes_erro: 0,
    parametros: { idade_maxima_dias: 90, manter_logs: true }
  },
  {
    nome: 'Notificações Inteligentes',
    tipo: 'notificacao',
    descricao: 'Analisa dados e envia alertas preditivos via IA',
    cron_expression: '0 8,14,18 * * 1-5',
    ativo: false,
    total_execucoes: 0,
    execucoes_sucesso: 0,
    execucoes_erro: 0,
    parametros: { prioridade_minima: 'media', canais: ['email', 'push'] }
  }
];

export function useRPAFinanceiro() {
  const queryClient = useQueryClient();
  const [tarefasLocais, setTarefasLocais] = useState<TarefaRPA[]>(
    tarefasDisponiveis.map((t, i) => ({ ...t, id: `rpa-${i + 1}` }))
  );
  const [execucoesLocais, setExecucoesLocais] = useState<ExecucaoRPA[]>([]);

  // Buscar histórico de execuções
  const { data: historicoAnalises } = useQuery({
    queryKey: ['rpa-historico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_analises_preditivas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Toggle ativo/inativo
  const toggleTarefa = (tarefaId: string) => {
    setTarefasLocais(prev => 
      prev.map(t => t.id === tarefaId ? { ...t, ativo: !t.ativo } : t)
    );
    toast.success('Status da tarefa atualizado');
  };

  // Executar tarefa manualmente
  const executarTarefa = useMutation({
    mutationFn: async (tarefa: TarefaRPA) => {
      const execucaoId = `exec-${Date.now()}`;
      const novaExecucao: ExecucaoRPA = {
        id: execucaoId,
        tarefa_id: tarefa.id,
        iniciado_em: new Date().toISOString(),
        status: 'executando',
        registros_processados: 0
      };

      setExecucoesLocais(prev => [novaExecucao, ...prev]);

      // Simular execução
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      const sucesso = Math.random() > 0.1;
      const registros = Math.floor(Math.random() * 100) + 1;

      const execucaoFinal: ExecucaoRPA = {
        ...novaExecucao,
        finalizado_em: new Date().toISOString(),
        status: sucesso ? 'sucesso' : 'erro',
        registros_processados: registros,
        resultado: sucesso ? { 
          processados: registros,
          ignorados: Math.floor(registros * 0.1),
          tempo_ms: 2000 + Math.random() * 3000
        } : undefined,
        erro_mensagem: sucesso ? undefined : 'Erro de conexão temporário'
      };

      setExecucoesLocais(prev => 
        prev.map(e => e.id === execucaoId ? execucaoFinal : e)
      );

      // Atualizar contadores
      setTarefasLocais(prev =>
        prev.map(t => {
          if (t.id === tarefa.id) {
            return {
              ...t,
              total_execucoes: t.total_execucoes + 1,
              execucoes_sucesso: t.execucoes_sucesso + (sucesso ? 1 : 0),
              execucoes_erro: t.execucoes_erro + (sucesso ? 0 : 1),
              ultima_execucao: new Date().toISOString()
            };
          }
          return t;
        })
      );

      if (!sucesso) throw new Error('Falha na execução');
      return execucaoFinal;
    },
    onSuccess: (_, tarefa) => {
      toast.success(`Tarefa "${tarefa.nome}" executada com sucesso`);
    },
    onError: (_, tarefa) => {
      toast.error(`Erro ao executar "${tarefa.nome}"`);
    }
  });

  // Atualizar parâmetros
  const atualizarParametros = (tarefaId: string, parametros: Record<string, unknown>) => {
    setTarefasLocais(prev =>
      prev.map(t => t.id === tarefaId ? { ...t, parametros } : t)
    );
    toast.success('Parâmetros atualizados');
  };

  // Atualizar cron
  const atualizarCron = (tarefaId: string, cron_expression: string) => {
    setTarefasLocais(prev =>
      prev.map(t => t.id === tarefaId ? { ...t, cron_expression } : t)
    );
    toast.success('Agendamento atualizado');
  };

  // Estatísticas gerais
  const estatisticas = {
    total_tarefas: tarefasLocais.length,
    tarefas_ativas: tarefasLocais.filter(t => t.ativo).length,
    total_execucoes: tarefasLocais.reduce((acc, t) => acc + t.total_execucoes, 0),
    taxa_sucesso: tarefasLocais.reduce((acc, t) => acc + t.total_execucoes, 0) > 0
      ? (tarefasLocais.reduce((acc, t) => acc + t.execucoes_sucesso, 0) / 
         tarefasLocais.reduce((acc, t) => acc + t.total_execucoes, 0)) * 100
      : 100,
    tempo_economizado_horas: tarefasLocais.reduce((acc, t) => acc + t.execucoes_sucesso * 0.5, 0)
  };

  return {
    tarefas: tarefasLocais,
    execucoes: execucoesLocais,
    estatisticas,
    toggleTarefa,
    executarTarefa,
    atualizarParametros,
    atualizarCron,
    isExecutando: executarTarefa.isPending
  };
}

// Helpers para parsing de cron
export function parseCronExpression(cron: string): string {
  const partes = cron.split(' ');
  if (partes.length !== 5) return 'Expressão inválida';

  const [minuto, hora, dia, mes, diaSemana] = partes;

  // Casos comuns
  if (cron === '* * * * *') return 'A cada minuto';
  if (cron === '0 * * * *') return 'A cada hora';
  if (cron === '0 0 * * *') return 'Todo dia à meia-noite';
  if (cron === '0 0 * * 0') return 'Todo domingo à meia-noite';
  if (cron === '0 0 1 * *') return 'Todo dia 1 do mês';

  // Padrões específicos
  const horarios = hora.includes(',') 
    ? `às ${hora.split(',').join('h, ')}h`
    : hora !== '*' ? `às ${hora}h` : '';

  const dias = diaSemana !== '*'
    ? diaSemana === '1-5' ? 'dias úteis' : `dia ${diaSemana} da semana`
    : dia !== '*' ? `dia ${dia}` : 'todos os dias';

  return `${dias} ${horarios}`.trim() || cron;
}

export function getIconeTarefa(tipo: TarefaRPA['tipo']) {
  const icones = {
    conciliacao: '🔄',
    cobranca: '💰',
    relatorio: '📊',
    backup: '💾',
    limpeza: '🧹',
    notificacao: '🔔'
  };
  return icones[tipo] || '⚙️';
}
