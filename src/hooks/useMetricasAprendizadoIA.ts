import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SerieAcerto {
  semana: string;
  total: number;
  aprovados: number;
  rejeitados: number;
  taxa: number;
}

export interface DistribuicaoConfianca {
  confianca: 'alta' | 'media' | 'baixa';
  total: number;
}

export interface RegraAplicada {
  id: string;
  nome: string;
  vezes_aplicada: number;
  tipo: string | null;
}

export interface HeatmapAnomalia {
  semana: string;
  tipo: string;
  total: number;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x.toISOString().slice(0, 10);
}

export function useMetricasAprendizadoIA() {
  return useQuery({
    queryKey: ['metricas-aprendizado-ia'],
    queryFn: async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - 90);

      const [feedbacksRes, historicoRes, regrasRes, anomaliasRes] = await Promise.all([
        supabase
          .from('feedback_conciliacao_ia')
          .select('acao, created_at')
          .gte('created_at', desde.toISOString()),
        supabase
          .from('historico_conciliacao_ia')
          .select('confianca, acao, created_at')
          .gte('created_at', desde.toISOString()),
        supabase
          .from('regras_conciliacao')
          .select('id, nome, vezes_aplicada, tipo')
          .eq('ativo', true)
          .order('vezes_aplicada', { ascending: false })
          .limit(10),
        supabase
          .from('anomalias_detectadas')
          .select('tipo_anomalia, detectada_em')
          .gte('detectada_em', desde.toISOString()),
      ]);

      const feedbacks = feedbacksRes.data ?? [];
      const historico = historicoRes.data ?? [];
      const regras = (regrasRes.data ?? []) as RegraAplicada[];
      const anomalias = anomaliasRes.data ?? [];

      // Série temporal semanal
      const semanasMap = new Map<string, { aprovados: number; rejeitados: number }>();
      for (const f of feedbacks) {
        const semana = startOfWeek(new Date(f.created_at));
        const cur = semanasMap.get(semana) ?? { aprovados: 0, rejeitados: 0 };
        if (f.acao === 'aprovado') cur.aprovados++;
        else if (f.acao === 'rejeitado') cur.rejeitados++;
        semanasMap.set(semana, cur);
      }
      const serieAcerto: SerieAcerto[] = Array.from(semanasMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([semana, v]) => {
          const total = v.aprovados + v.rejeitados;
          return {
            semana,
            total,
            aprovados: v.aprovados,
            rejeitados: v.rejeitados,
            taxa: total ? Math.round((v.aprovados / total) * 100) : 0,
          };
        });

      // Distribuição confiança
      const confMap: Record<'alta' | 'media' | 'baixa', number> = {
        alta: 0, media: 0, baixa: 0,
      };
      for (const h of historico) {
        const c = h.confianca as 'alta' | 'media' | 'baixa' | null;
        if (c && c in confMap) confMap[c]++;
      }
      const distribuicaoConfianca: DistribuicaoConfianca[] = (
        ['alta', 'media', 'baixa'] as const
      ).map((c) => ({ confianca: c, total: confMap[c] }));

      // Heatmap anomalias
      const heatMap = new Map<string, number>();
      for (const a of anomalias) {
        const semana = startOfWeek(new Date(a.detectada_em));
        const key = `${semana}|${a.tipo_anomalia}`;
        heatMap.set(key, (heatMap.get(key) ?? 0) + 1);
      }
      const heatmap: HeatmapAnomalia[] = Array.from(heatMap.entries()).map(([k, total]) => {
        const [semana, tipo] = k.split('|');
        return { semana, tipo, total };
      });

      return {
        serieAcerto,
        distribuicaoConfianca,
        regras,
        heatmap,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
