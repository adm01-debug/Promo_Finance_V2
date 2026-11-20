// Edge: calcular-slo-metrics-diario
// Agrega métricas das últimas 24h e persiste snapshot em slo_metrics_diarias.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { corsHeadersComSegredoPara, exigirChamadaInterna } from '../_shared/auth-guard.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
const log = createLogger('calcular-slo-metrics-diario');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx]);
}

/** Métricas agregadas que alimentam o upsert de slo_metrics_diarias. */
export interface MetricasSLO {
  hoje: string;
  totalReq: number;
  p50: number;
  p95: number;
  p99: number;
  taxaErro: number;
  uptime: number;
  cronOk: number;
  cronFail: number;
  edgesHealth: Record<string, unknown>;
  calculadoEm: string;
}

/** Agrega vw_edge_health + cron history em MetricasSLO. */
async function coletarMetricas(
  edgesBrutos: readonly any[],
  cronRecent: readonly any[]
): Promise<MetricasSLO> {
  const edges = edgesBrutos as any[];
  const totalReq = edges.reduce((s, r) => s + Number(r.total_calls || 0), 0);
  const totalErr = edges.reduce((s, r) => s + Number(r.error_count || 0), 0);
  const taxaErro = totalReq > 0 ? Number(((totalErr / totalReq) * 100).toFixed(2)) : 0;
  const latencias = edges.map((r) => Number(r.p95_ms || 0)).filter((n) => n > 0);
  const p50 = percentile(latencias, 50);
  const p95 = percentile(latencias, 95);
  const p99 = percentile(latencias, 99);
  const cronOk = cronRecent.filter((r) => r.status === 'succeeded').length;
  const cronFail = cronRecent.filter((r) => r.status === 'failed').length;
  const uptime =
    cronRecent.length > 0 ? Number(((cronOk / cronRecent.length) * 100).toFixed(2)) : 100;

  const edgesHealth: Record<string, any> = {};
  for (const r of edges) {
    edgesHealth[r.function_name] = { calls: r.total_calls, errors: r.error_count, p95: r.p95_ms };
  }

  return {
    hoje: new Date().toISOString().slice(0, 10),
    totalReq,
    p50,
    p95,
    p99,
    taxaErro,
    uptime,
    cronOk,
    cronFail,
    edgesHealth,
    calculadoEm: new Date().toISOString(),
  };
}

/** Monta o payload do upsert em slo_metrics_diarias. Expor para teste direto. */
export function montarUpsertSLO(metricas: MetricasSLO): Record<string, unknown> {
  return {
    // `servico` é NOT NULL sem default; versionado em
    // migrations/20261120130000_add_servico_slo_metrics_diarias.sql. Esta
    // edge é o único escritor, então o valor é fixo por serviço.
    servico: 'geral',
    data: metricas.hoje,
    total_requisicoes: metricas.totalReq,
    latencia_p50_ms: metricas.p50,
    latencia_p95_ms: metricas.p95,
    latencia_p99_ms: metricas.p99,
    taxa_erro_pct: metricas.taxaErro,
    uptime_pct: metricas.uptime,
    cron_jobs_sucesso: metricas.cronOk,
    cron_jobs_falha: metricas.cronFail,
    edges_health: metricas.edgesHealth,
    calculado_em: metricas.calculadoEm,
  };
}

export const handler = async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersComSegredoPara(req) });
  }

  const guard = await exigirChamadaInterna(req);
  if (!guard.ok) return guard.resposta;

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Edge health view (já existe)
    const { data: edgeHealth } = await sb.from('vw_edge_health' as never).select('*');
    const edges = (edgeHealth ?? []) as any[];

    // Cron history últimas 24h
    const { data: cronHist } = await (sb as any).rpc('get_cron_run_history', { p_limit: 500 });
    const cronRecent = ((cronHist ?? []) as any[]).filter(
      (r) => r.start_time && new Date(r.start_time).toISOString() >= since
    );

    const metricas = await coletarMetricas(edges, cronRecent);
    const { p95, totalReq, taxaErro, uptime } = metricas;
    const hoje = metricas.hoje;

    const { error } = await sb
      .from('slo_metrics_diarias' as never)
      .upsert(montarUpsertSLO(metricas) as never);

    if (error) throw error;

    // Retenção 90 dias
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await sb
      .from('slo_metrics_diarias' as never)
      .delete()
      .lt('data', cutoff);

    return new Response(
      JSON.stringify({
        ok: true,
        data: hoje,
        total_requisicoes: totalReq,
        p95,
        taxa_erro_pct: taxaErro,
        uptime_pct: uptime,
      }),
      { headers: { ...corsHeadersComSegredoPara(req), 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    log.error('calcular-slo-metrics-diario:', {
      error_message: mensagemErro(e),
      context: contextoErro(e),
    });
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeadersComSegredoPara(req), 'Content-Type': 'application/json' },
    });
  }
};

if (import.meta.main) {
  Deno.serve(
    withEdgeObservability('calcular-slo-metrics-diario', async (req) => {
      const _t0 = Date.now();
      try {
        return await handler(req);
      } finally {
        log.info('request', { duration_ms: Date.now() - _t0 });
        await log.flush();
      }
    })
  );
}
