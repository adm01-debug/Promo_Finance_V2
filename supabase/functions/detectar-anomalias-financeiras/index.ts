import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-trigger-source",
};

// Lock key estável (int4) — derivado a partir de string fixa
const LOCK_KEY = 738291045;

interface AnomaliaInsert {
  empresa_id: string | null;
  entidade_tipo: string;
  entidade_id: string | null;
  tipo_anomalia: string;
  severidade: "baixa" | "media" | "alta" | "critica";
  descricao: string;
  dados: Record<string, unknown>;
  centro_custo_id?: string | null;
}

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const v = arr.reduce((s, x) => s + Math.pow(x - m, 2), 0) / arr.length;
  return Math.sqrt(v);
}
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(url, key);

  const triggerSource =
    req.headers.get("x-trigger-source") === "cron" ? "cron" : "manual";

  let body: { run_id?: string } = {};
  try {
    if (req.method === "POST") body = await req.json();
  } catch {
    body = {};
  }

  // Limpa órfãos antigos (queued > 5min)
  await client
    .from("anomalia_detection_runs")
    .update({ status: "cancelled", finished_at: new Date().toISOString() })
    .eq("status", "queued")
    .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

  // Tenta adquirir o lock
  const { data: lockRow, error: lockErr } = await client.rpc("pg_try_advisory_lock" as never, {
    key: LOCK_KEY,
  } as never).single?.() ?? ({ data: null, error: null } as { data: unknown; error: unknown });
  void lockRow;
  void lockErr;
  // pg_try_advisory_lock não está exposto via RPC por padrão — usamos query direta
  // Alternativa: chamar via fetch direta no PostgREST não funciona. Vamos usar o approach baseado em verificação de runs ativos.

  // Verifica se já há run ativo (running)
  const { data: ativos } = await client
    .from("anomalia_detection_runs")
    .select("id, status, started_at")
    .in("status", ["running"])
    .gte("started_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .order("started_at", { ascending: false })
    .limit(1);

  if (ativos && ativos.length > 0) {
    return new Response(
      JSON.stringify({
        ok: false,
        reason: "already_running",
        current_run_id: ativos[0].id,
      }),
      {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Cria ou atualiza o run
  let runId: string;
  if (body.run_id) {
    runId = body.run_id;
    await client
      .from("anomalia_detection_runs")
      .update({
        status: "running",
        started_at: new Date().toISOString(),
        current_step: "iniciando",
        step_index: 0,
        trigger_source: triggerSource,
      })
      .eq("id", runId);
  } else {
    const { data: newRun, error: createErr } = await client
      .from("anomalia_detection_runs")
      .insert({
        status: "running",
        started_at: new Date().toISOString(),
        current_step: "iniciando",
        trigger_source: triggerSource,
      })
      .select("id")
      .single();
    if (createErr || !newRun) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "failed_to_create_run" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    runId = newRun.id;
  }

  const startedAt = Date.now();

  const updateRun = async (patch: Record<string, unknown>) => {
    await client.from("anomalia_detection_runs").update(patch).eq("id", runId);
  };

  try {
    const novas: AnomaliaInsert[] = [];

    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);

    // ============ Detector 1: movimentação > 3σ ============
    await updateRun({ current_step: "detector_outlier", step_index: 1 });
    const { data: movs } = await client
      .from("movimentacoes")
      .select("id, valor, empresa_id, data_movimentacao, descricao, centro_custo_id")
      .gte("data_movimentacao", trintaDiasAtras)
      .limit(5000);
    if (movs && movs.length > 5) {
      const valores = movs.map((m: { valor: number }) => Math.abs(Number(m.valor)));
      const m = mean(valores);
      const sd = stddev(valores);
      const limite = m + 3 * sd;
      for (const mov of movs) {
        const v = Math.abs(Number(mov.valor));
        if (sd > 0 && v > limite) {
          novas.push({
            empresa_id: mov.empresa_id,
            entidade_tipo: "movimentacao",
            entidade_id: mov.id,
            tipo_anomalia: "movimentacao_outlier",
            severidade: v > m + 5 * sd ? "critica" : "alta",
            descricao: `Movimentação de R$ ${v.toFixed(2)} excede 3σ (média R$ ${m.toFixed(2)}).`,
            dados: { valor: v, media: m, desvio: sd, limite },
            centro_custo_id: (mov as { centro_custo_id?: string | null }).centro_custo_id ?? null,
          });
        }
      }
    }
    await updateRun({ candidatas: novas.length });

    // ============ Detector 2: pagamento duplicado ============
    await updateRun({ current_step: "detector_duplicado", step_index: 2 });
    const { data: pagsRecentes } = await client
      .from("contas_pagar")
      .select("id, fornecedor_id, valor, data_vencimento, empresa_id, descricao, centro_custo_id")
      .gte("data_vencimento", seteDiasAtras)
      .limit(2000);
    if (pagsRecentes) {
      const buckets = new Map<string, Array<{ id: string; empresa_id: string | null; descricao: string | null; centro_custo_id: string | null }>>();
      for (const p of pagsRecentes) {
        const k = `${p.fornecedor_id}|${p.valor}|${p.data_vencimento}`;
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k)!.push(p);
      }
      for (const [k, arr] of buckets.entries()) {
        if (arr.length > 1) {
          for (const p of arr.slice(1)) {
            novas.push({
              empresa_id: p.empresa_id,
              entidade_tipo: "conta_pagar",
              entidade_id: p.id,
              tipo_anomalia: "pagamento_duplicado",
              severidade: "alta",
              descricao: `Possível pagamento duplicado: ${arr.length} contas com mesma chave (${k}).`,
              dados: { chave: k, ids: arr.map((x) => x.id) },
              centro_custo_id: p.centro_custo_id ?? null,
            });
          }
        }
      }
    }
    await updateRun({ candidatas: novas.length });

    // ============ Detector 3: conta a pagar > p95 ============
    await updateRun({ current_step: "detector_p95", step_index: 3 });
    const { data: empresas } = await client
      .from("empresas")
      .select("id")
      .eq("ativo", true);
    for (const emp of empresas ?? []) {
      const { data: cps } = await client
        .from("contas_pagar")
        .select("id, valor, descricao, centro_custo_id")
        .eq("empresa_id", emp.id)
        .gte("data_vencimento", trintaDiasAtras);
      if (cps && cps.length > 10) {
        const vals = cps.map((c: { valor: number }) => Number(c.valor));
        const p95 = percentile(vals, 95);
        for (const c of cps) {
          if (Number(c.valor) > p95 * 1.5) {
            novas.push({
              empresa_id: emp.id,
              entidade_tipo: "conta_pagar",
              entidade_id: c.id,
              tipo_anomalia: "conta_pagar_alta",
              severidade: "media",
              descricao: `Conta a pagar de R$ ${Number(c.valor).toFixed(2)} excede 1.5x p95 (R$ ${p95.toFixed(2)}).`,
              dados: { valor: Number(c.valor), p95 },
              centro_custo_id: (c as { centro_custo_id?: string | null }).centro_custo_id ?? null,
            });
          }
        }
      }
    }
    await updateRun({ candidatas: novas.length });

    // ============ Detector 4: conciliação atrasada > 30d ============
    await updateRun({ current_step: "detector_conciliacao", step_index: 4 });
    const { data: txAtrasadas } = await client
      .from("transacoes_bancarias")
      .select("id, valor, data, conta_bancaria_id, descricao")
      .eq("conciliada", false)
      .lt("data", trintaDiasAtras)
      .limit(500);
    for (const tx of txAtrasadas ?? []) {
      novas.push({
        empresa_id: null,
        entidade_tipo: "transacao_bancaria",
        entidade_id: tx.id,
        tipo_anomalia: "conciliacao_atrasada",
        severidade: "media",
        descricao: `Transação de ${tx.data} (R$ ${Number(tx.valor).toFixed(2)}) sem conciliação há mais de 30 dias.`,
        dados: { valor: Number(tx.valor), data: tx.data },
      });
    }
    await updateRun({ candidatas: novas.length });

    // ============ Detector 5: variação brusca de carga ============
    await updateRun({ current_step: "detector_regime", step_index: 5 });
    const { data: regimes } = await client
      .from("regime_decision_cache")
      .select("empresa_id, ano, mes, carga_pct, regime_recomendado")
      .order("ano", { ascending: false })
      .order("mes", { ascending: false })
      .limit(500);
    if (regimes) {
      const byEmp = new Map<string, Array<{ carga_pct: number | null; ano: number; mes: number }>>();
      for (const r of regimes) {
        if (!r.empresa_id) continue;
        if (!byEmp.has(r.empresa_id)) byEmp.set(r.empresa_id, []);
        byEmp.get(r.empresa_id)!.push(r);
      }
      for (const [empId, arr] of byEmp.entries()) {
        if (arr.length < 2) continue;
        const [atual, anterior] = arr;
        if (atual.carga_pct && anterior.carga_pct) {
          const variacao = Math.abs(
            ((Number(atual.carga_pct) - Number(anterior.carga_pct)) /
              Number(anterior.carga_pct)) *
              100
          );
          if (variacao > 30) {
            novas.push({
              empresa_id: empId,
              entidade_tipo: "regime_decision_cache",
              entidade_id: null,
              tipo_anomalia: "mudanca_regime_brusca",
              severidade: variacao > 50 ? "critica" : "alta",
              descricao: `Carga tributária variou ${variacao.toFixed(1)}% MoM (de ${Number(
                anterior.carga_pct
              ).toFixed(2)}% para ${Number(atual.carga_pct).toFixed(2)}%).`,
              dados: { variacao_pct: variacao, atual: atual.carga_pct, anterior: anterior.carga_pct },
            });
          }
        }
      }
    }
    await updateRun({ candidatas: novas.length, current_step: "persistindo" });

    // Persiste evitando duplicatas
    let inseridas = 0;
    for (const a of novas) {
      const dia = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data: existe } = await client
        .from("anomalias_detectadas")
        .select("id")
        .eq("entidade_tipo", a.entidade_tipo)
        .eq("tipo_anomalia", a.tipo_anomalia)
        .gte("detectada_em", dia)
        .maybeSingle();
      if (existe) continue;
      const { error } = await client.from("anomalias_detectadas").insert(a);
      if (!error) inseridas++;
    }

    const duration = Date.now() - startedAt;
    await updateRun({
      status: "completed",
      current_step: "concluido",
      step_index: 5,
      candidatas: novas.length,
      inseridas,
      finished_at: new Date().toISOString(),
      duration_ms: duration,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        run_id: runId,
        candidatas: novas.length,
        inseridas,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("detectar-anomalias-financeiras error:", e);
    const msg = e instanceof Error ? e.message : "unknown";
    await updateRun({
      status: "failed",
      error_message: msg,
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    });
    return new Response(
      JSON.stringify({ error: msg, run_id: runId }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
