import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { MatchSugestaoIA } from './useConciliacaoIA';

interface HistoricoConciliacaoIA {
  id: string;
  transacao_bancaria_id: string | null;
  conta_pagar_id: string | null;
  conta_receber_id: string | null;
  tipo_lancamento: 'pagar' | 'receber';
  score_ia: number;
  confianca: 'alta' | 'media' | 'baixa';
  motivos: Array<{ tipo: string; peso: number; detalhe: string }>;
  analise_ia: string | null;
  acao: 'aprovado' | 'rejeitado';
  aprovado_por: string | null;
  created_at: string;
}

interface FeedbackConciliacaoIA {
  id: string;
  transacao_descricao: string;
  lancamento_entidade: string;
  lancamento_descricao: string | null;
  tipo_lancamento: 'pagar' | 'receber';
  score_original: number;
  acao: 'aprovado' | 'rejeitado';
  motivo_rejeicao: string | null;
  created_by: string | null;
  created_at: string;
}

interface RegistrarHistoricoParams {
  transacaoId?: string;
  lancamentoId: string;
  tipoLancamento: 'pagar' | 'receber';
  score: number;
  confianca: 'alta' | 'media' | 'baixa';
  motivos: Array<{ tipo: string; peso: number; detalhe: string }>;
  analiseIA?: string;
  acao: 'aprovado' | 'rejeitado';
}

interface RegistrarFeedbackParams {
  transacaoDescricao: string;
  lancamentoEntidade: string;
  lancamentoDescricao?: string;
  tipoLancamento: 'pagar' | 'receber';
  scoreOriginal: number;
  acao: 'aprovado' | 'rejeitado';
  motivoRejeicao?: string;
}

export function useHistoricoConciliacaoIA() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: historico = [], isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['historico-conciliacao-ia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_conciliacao_ia')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as HistoricoConciliacaoIA[];
    },
  });

  const { data: feedback = [], isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['feedback-conciliacao-ia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_conciliacao_ia')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as FeedbackConciliacaoIA[];
    },
  });

  const registrarHistorico = useMutation({
    mutationFn: async (params: RegistrarHistoricoParams) => {
      const insertData: any = {
        tipo_lancamento: params.tipoLancamento,
        score_ia: params.score,
        confianca: params.confianca,
        motivos: params.motivos,
        analise_ia: params.analiseIA || null,
        acao: params.acao,
        aprovado_por: user?.id || null,
      };

      if (params.tipoLancamento === 'pagar') {
        insertData.conta_pagar_id = params.lancamentoId;
      } else {
        insertData.conta_receber_id = params.lancamentoId;
      }

      const { data, error } = await supabase
        .from('historico_conciliacao_ia')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-conciliacao-ia'] });
    },
    onError: (error) => {
      console.error('Erro ao registrar histórico:', error);
    },
  });

  const registrarFeedback = useMutation({
    mutationFn: async (params: RegistrarFeedbackParams) => {
      const { data, error } = await supabase
        .from('feedback_conciliacao_ia')
        .insert({
          transacao_descricao: params.transacaoDescricao,
          lancamento_entidade: params.lancamentoEntidade,
          lancamento_descricao: params.lancamentoDescricao || null,
          tipo_lancamento: params.tipoLancamento,
          score_original: params.scoreOriginal,
          acao: params.acao,
          motivo_rejeicao: params.motivoRejeicao || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-conciliacao-ia'] });
    },
    onError: (error) => {
      console.error('Erro ao registrar feedback:', error);
    },
  });

  // Função para aprovar em lote
  const aprovarEmLote = useMutation({
    mutationFn: async (matches: Array<{ 
      transacaoId: string;
      transacaoDescricao: string;
      sugestao: MatchSugestaoIA 
    }>) => {
      const results: { success: number; failed: number } = { success: 0, failed: 0 };

      for (const match of matches) {
        try {
          // Registrar histórico
          await registrarHistorico.mutateAsync({
            transacaoId: match.transacaoId,
            lancamentoId: match.sugestao.lancamentoId,
            tipoLancamento: match.sugestao.lancamentoTipo,
            score: match.sugestao.score,
            confianca: match.sugestao.confianca,
            motivos: match.sugestao.motivos,
            analiseIA: match.sugestao.analiseIA,
            acao: 'aprovado',
          });

          // Registrar feedback para treinar IA
          await registrarFeedback.mutateAsync({
            transacaoDescricao: match.transacaoDescricao,
            lancamentoEntidade: match.sugestao.lancamento?.entidade || '',
            lancamentoDescricao: match.sugestao.lancamento?.descricao,
            tipoLancamento: match.sugestao.lancamentoTipo,
            scoreOriginal: match.sugestao.score,
            acao: 'aprovado',
          });

          results.success++;
        } catch (error) {
          console.error('Erro ao aprovar match:', error);
          results.failed++;
        }
      }

      return results;
    },
    onSuccess: (results) => {
      if (results.success > 0) {
        toast.success(`${results.success} conciliações aprovadas em lote`, {
          description: results.failed > 0 ? `${results.failed} falharam` : undefined
        });
      }
      queryClient.invalidateQueries({ queryKey: ['historico-conciliacao-ia'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-conciliacao-ia'] });
    },
  });

  // Estatísticas do histórico
  const estatisticasHistorico = {
    totalAprovados: historico.filter(h => h.acao === 'aprovado').length,
    totalRejeitados: historico.filter(h => h.acao === 'rejeitado').length,
    altaConfianca: historico.filter(h => h.confianca === 'alta').length,
    mediaConfianca: historico.filter(h => h.confianca === 'media').length,
    baixaConfianca: historico.filter(h => h.confianca === 'baixa').length,
    scoreMedia: historico.length > 0 
      ? Math.round(historico.reduce((acc, h) => acc + h.score_ia, 0) / historico.length)
      : 0,
  };

  return {
    historico,
    feedback,
    isLoadingHistorico,
    isLoadingFeedback,
    registrarHistorico,
    registrarFeedback,
    aprovarEmLote,
    estatisticasHistorico,
  };
}
