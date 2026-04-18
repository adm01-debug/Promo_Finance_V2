// Edge: calcular-slo-metrics-diario
// Agrega métricas das últimas 24h e persiste snapshot em slo_metrics_diarias.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const hoje = new Date().toISOString().slice(0, 10);

    // Edge health view (já existe)
    const { data: edgeHealth } = await sb.from("vw_edge_health" as never).select("*");
    const edges = (edgeHealth ?? []) as any[];
    const totalReq = edges.reduce((s, r) => s + Number(r.total_calls || 0), 0);
    const totalErr = edges.reduce((s, r) => s + Number(r.error_count || 0), 0);
    const taxaErro = totalReq > 0 ? Number(((totalErr / totalReq) * 100).toFixed(2)) : 0;
    const latencias = edges.map((r) => Number(r.p95_ms || 0)).filter((n) => n > 0);
    const p50 = percentile(latencias, 50);
    const p95 = percentile(latencias, 95);
    const p99 = percentile(latencias, 99);

    // Cron history últimas 24h
    const { data: cronHist } = await (sb as any).rpc("get_cron_run_history", { p_limit: 500 });
    const cronRecent = ((cronHist ?? []) as any[]).filter((r) => r.start_time && new Date(r.start_time).toISOString() >= since);
    const cronOk = cronRecent.filter((r) => r.status === "succeeded").length;
    const cronFail = cronRecent.filter((r) => r.status === "failed").length;
    const uptime = cronRecent.length > 0 ? Number(((cronOk / cronRecent.length) * 100).toFixed(2)) : 100;

    const edgesHealth: Record<string, any> = {};
    for (const r of edges) {
      edgesHealth[r.function_name] = {
        calls: r.total_calls,
        errors: r.error_count,
        p95: r.p95_ms,
      };
    }

    const { error } = await sb.from("slo_metrics_diarias" as never).upsert({
      data: hoje,
      total_requisicoes: totalReq,
      latencia_p50_ms: p50,
      latencia_p95_ms: p95,
      latencia_p99_ms: p99,
      taxa_erro_pct: taxaErro,
      uptime_pct: uptime,
      cron_jobs_sucesso: cronOk,
      cron_jobs_falha: cronFail,
      edges_health: edgesHealth,
      calculado_em: new Date().toISOString(),
    } as never);

    if (error) throw error;

    // Retenção 90 dias
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await sb.from("slo_metrics_diarias" as never).delete().lt("data", cutoff);

    return new Response(
      JSON.stringify({ ok: true, data: hoje, total_requisicoes: totalReq, p95, taxa_erro_pct: taxaErro, uptime_pct: uptime }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("calcular-slo-metrics-diario:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
