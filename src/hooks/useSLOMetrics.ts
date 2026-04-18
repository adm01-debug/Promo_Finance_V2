import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SLOMetric {
  data: string;
  total_requisicoes: number;
  latencia_p50_ms: number;
  latencia_p95_ms: number;
  latencia_p99_ms: number;
  taxa_erro_pct: number;
  uptime_pct: number;
  cron_jobs_sucesso: number;
  cron_jobs_falha: number;
  edges_health: Record<string, unknown>;
  calculado_em: string;
}

export function useSLOMetrics(diasJanela = 30) {
  return useQuery({
    queryKey: ['slo-metrics', diasJanela],
    queryFn: async (): Promise<SLOMetric[]> => {
      const since = new Date(Date.now() - diasJanela * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('slo_metrics_diarias' as never)
        .select('*')
        .gte('data', since)
        .order('data', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SLOMetric[];
    },
    refetchInterval: 5 * 60_000,
  });
}
