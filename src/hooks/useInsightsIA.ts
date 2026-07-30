import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InsightsIAKpi {
  anomalias24h: number;
  anomaliasCriticas: number;
  taxaAcertoIA: number;
  feedbackTotal: number;
  regrasAtivas: number;
  totalAplicacoes: number;
  valorSobRevisao: number;
}

export function useInsightsIAKpis() {
  return useQuery({
    queryKey: ['insights-ia-kpis'],
    queryFn: async (): Promise<InsightsIAKpi> => {
      const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [anomaliasRes, feedbackRes, regrasRes] = await Promise.all([
        supabase
          .from('anomalias_detectadas')
          .select('id, severidade, status, dados', { count: 'exact' })
          .gte('detectada_em', desde24h)
          .eq('status', 'nova'),
        supabase
          .from('feedback_conciliacao_ia')
          .select('acao'),
        supabase
          .from('regras_conciliacao')
          .select('id, ativo, vezes_aplicada'),
      ]);

      const anomalias = anomaliasRes.data ?? [];
      const feedbacks = feedbackRes.data ?? [];
      const regras = regrasRes.data ?? [];

      const aprovados = feedbacks.filter((f) => f.acao === 'aprovado').length;
      const taxa = feedbacks.length ? (aprovados / feedbacks.length) * 100 : 0;

      const valorSobRevisao = anomalias.reduce((acc, a) => {
        const dados = (a.dados ?? {}) as Record<string, unknown>;
        const v = Number(dados.valor ?? dados.valor_total ?? 0);
        return acc + (Number.isFinite(v) ? Math.abs(v) : 0);
      }, 0);

      return {
        anomalias24h: anomalias.length,
        anomaliasCriticas: anomalias.filter((a) => a.severidade === 'critica').length,
        taxaAcertoIA: taxa,
        feedbackTotal: feedbacks.length,
        regrasAtivas: regras.filter((r) => r.ativo).length,
        totalAplicacoes: regras.reduce((s, r) => s + (r.vezes_aplicada ?? 0), 0),
        valorSobRevisao,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
