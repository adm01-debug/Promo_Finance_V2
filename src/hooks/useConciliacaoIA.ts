import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TransacaoOFX } from '@/lib/ofx-parser';
import { LancamentoSistema } from '@/lib/transaction-matcher';
import { logger } from '@/lib/logger';

export interface MatchSugestaoIA {
  transacaoId: string;
  lancamentoId: string;
  lancamentoTipo: 'pagar' | 'receber';
  score: number;
  confianca: 'alta' | 'media' | 'baixa';
  motivos: Array<{
    tipo: string;
    peso: number;
    detalhe: string;
  }>;
  analiseIA?: string;
  lancamento?: LancamentoSistema;
}

interface ConciliacaoIAResponse {
  matches: MatchSugestaoIA[];
  processedAt: string;
  transacoesAnalisadas: number;
  lancamentosAnalisados: number;
}

export function useConciliacaoIA() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchesIA, setMatchesIA] = useState<Map<string, MatchSugestaoIA[]>>(new Map());
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const analisarConciliacao = useCallback(async (
    transacoes: TransacaoOFX[],
    lancamentos: LancamentoSistema[]
  ): Promise<Map<string, MatchSugestaoIA[]>> => {
    if (transacoes.length === 0 || lancamentos.length === 0) {
      toast.info('Dados insuficientes para análise de IA');
      return new Map();
    }

    setIsAnalyzing(true);

    try {
      // Prepare data for edge function
      const transacoesData = transacoes.map(t => ({
        id: t.id,
        data: t.data.toISOString().split('T')[0],
        descricao: t.descricao,
        valor: t.valor,
        tipo: t.tipo
      }));

      const lancamentosData = lancamentos.map(l => ({
        id: l.id,
        tipo: l.tipo,
        entidade: l.entidade,
        descricao: l.descricao,
        valor: l.valor,
        dataVencimento: l.dataVencimento.toISOString().split('T')[0],
        documento: l.numeroDocumento
      }));

      const { data, error } = await supabase.functions.invoke<ConciliacaoIAResponse>('conciliacao-ia', {
        body: { 
          transacoes: transacoesData, 
          lancamentos: lancamentosData 
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.matches) {
        throw new Error('Resposta inválida da análise de IA');
      }

      // Organize matches by transaction ID and enrich with lancamento data
      const matchesMap = new Map<string, MatchSugestaoIA[]>();
      
      for (const match of data.matches) {
        const lancamento = lancamentos.find(l => l.id === match.lancamentoId);
        if (!lancamento) continue;

        const enrichedMatch: MatchSugestaoIA = {
          ...match,
          lancamento
        };

        const existing = matchesMap.get(match.transacaoId) || [];
        existing.push(enrichedMatch);
        // Sort by score descending
        existing.sort((a, b) => b.score - a.score);
        matchesMap.set(match.transacaoId, existing);
      }

      setMatchesIA(matchesMap);
      setLastAnalysis(new Date());

      const altaConfianca = data.matches.filter(m => m.confianca === 'alta').length;
      const mediaConfianca = data.matches.filter(m => m.confianca === 'media').length;

      toast.success('Análise de IA concluída', {
        description: `${altaConfianca} matches de alta confiança, ${mediaConfianca} de média confiança`
      });

      return matchesMap;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('[useConciliacaoIA] Erro na análise de IA:', err);
      
      if (err.message?.includes('429') || err.message?.includes('rate limit')) {
        toast.error('Limite de requisições excedido', {
          description: 'Aguarde alguns instantes e tente novamente'
        });
      } else if (err.message?.includes('402')) {
        toast.error('Créditos insuficientes', {
          description: 'Entre em contato com o administrador'
        });
      } else {
        toast.error('Erro na análise de IA', {
          description: 'Usando algoritmo tradicional como fallback'
        });
      }
      
      return new Map();
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearMatches = useCallback(() => {
    setMatchesIA(new Map());
    setLastAnalysis(null);
  }, []);

  return {
    isAnalyzing,
    matchesIA,
    lastAnalysis,
    analisarConciliacao,
    clearMatches
  };
}
