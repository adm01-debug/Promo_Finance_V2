// Edge Function: sefaz-dfe-dispatcher
// Cron entrypoint (a cada 15min) que faz fan-out do puxador DFe por CNPJ ativo,
// aplicando política de retry + backoff exponencial + circuit breaker.
//
// Política pura em ./policy.ts (testada em policy_test.ts com 1000 cenários).

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { getRequestId, correlationResponseHeaders } from "../_shared/correlation.ts";
import { ConcurrencyLimiter } from "../_shared/concurrency-limiter.ts";
import {
  applyOutcome,
  isEligible,
  PULLER_MISSING_TAG,
  type CursorState,
  type PullOutcome,
} from "./policy.ts";

const CONCURRENCY = 5;
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000; // pula CNPJ consultado nos últimos 5min
const PER_CNPJ_TIMEOUT_MS = 45_000;

interface EligibleCnpj {
  cursor_id: string;
  cnpj: string;
  ambiente: "producao" | "homologacao";
  cursor: CursorState;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const requestId = getRequestId(req);
  const logger = createLogger("sefaz-dfe-dispatcher", requestId);
  const headers = {
    ...corsHeaders,
    ...correlationResponseHeaders(requestId),
    "Content-Type": "application/json",
  };
  const t0 = Date.now();

  // ---- Autenticação (cron secret) ----
  const cronSecret = Deno.env.get("CRON_DISPATCH_SECRET");
  if (!cronSecret) {
    logger.error("missing CRON_DISPATCH_SECRET");
    return new Response(JSON.stringify({ error: "server-misconfigured" }), {
      status: 500,
      headers,
    });
  }
  if (req.headers.get("x-cron-secret") !== cronSecret) {
    logger.warn("unauthorized dispatch attempt");
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const jobStartedAt = new Date().toISOString();

  try {
    // ---- Query de elegíveis: certificado ativo + válido + cursor sem circuit + due ----
    const nowIso = new Date().toISOString();
    const { data: rows, error } = await supabase
      .from("empresas_certificados")
      .select(
        `cnpj, ambiente, ativo, valido_ate,
         sefaz_dfe_cursor!inner(id, cnpj, ambiente, retry_count, next_run_at, last_error_at, circuit_open, ultima_consulta)`,
      )
      .eq("ativo", true)
      .gt("valido_ate", nowIso);

    if (error) throw new Error(`query elegíveis falhou: ${error.message}`);

    const now = Date.now();
    const elegiveis: EligibleCnpj[] = [];
    for (const row of rows ?? []) {
      // Supabase FK expansion pode vir como array ou objeto — normaliza.
      const cursors = Array.isArray(row.sefaz_dfe_cursor)
        ? row.sefaz_dfe_cursor
        : [row.sefaz_dfe_cursor];
      for (const c of cursors) {
        if (!c) continue;
        if (c.ambiente !== row.ambiente) continue;
        const cursor: CursorState = {
          cnpj: c.cnpj,
          retry_count: c.retry_count ?? 0,
          next_run_at: c.next_run_at ? Date.parse(c.next_run_at) : 0,
          last_error_at: c.last_error_at ? Date.parse(c.last_error_at) : null,
          circuit_open: !!c.circuit_open,
          ultima_consulta: c.ultima_consulta ? Date.parse(c.ultima_consulta) : null,
        };
        if (!isEligible(cursor, now)) continue;
        // Guarda de idempotência (evita rajadas se cron disparar concorrente).
        if (
          cursor.ultima_consulta &&
          now - cursor.ultima_consulta < IDEMPOTENCY_WINDOW_MS
        ) {
          continue;
        }
        elegiveis.push({
          cursor_id: c.id,
          cnpj: c.cnpj,
          ambiente: c.ambiente,
          cursor,
        });
      }
    }

    logger.info("dispatch_start", { elegiveis: elegiveis.length });

    const limiter = new ConcurrencyLimiter(CONCURRENCY);
    let sucesso = 0;
    let falha = 0;
    let neutras = 0;
    let circuitAbertos = 0;

    const results = await Promise.allSettled(
      elegiveis.map((e) =>
        limiter.run(async () => {
          const outcome = await invokePuller(supabase, e, logger, requestId);
          const now2 = Date.now();
          const next = applyOutcome(e.cursor, outcome, now2);

          const { error: upErr } = await supabase
            .from("sefaz_dfe_cursor")
            .update({
              retry_count: next.retry_count,
              next_run_at: new Date(next.next_run_at).toISOString(),
              last_error_at: next.last_error_at
                ? new Date(next.last_error_at).toISOString()
                : null,
              circuit_open: next.circuit_open,
              ultima_consulta: next.ultima_consulta
                ? new Date(next.ultima_consulta).toISOString()
                : null,
              ultimo_status: outcome.kind === "success" ? "ok" : outcome.errorTag ?? "erro",
              ultimo_erro: outcome.kind === "failure" ? outcome.errorTag ?? null : null,
            })
            .eq("id", e.cursor_id);

          if (upErr) {
            logger.error("cursor_update_failed", {
              cnpj: e.cnpj,
              error: upErr.message,
            });
          }

          if (outcome.kind === "success") sucesso++;
          else if (outcome.neutral) neutras++;
          else falha++;
          if (next.circuit_open && !e.cursor.circuit_open) circuitAbertos++;
          return { cnpj: e.cnpj, outcome, circuit_open: next.circuit_open };
        }),
      ),
    );

    const durationMs = Date.now() - t0;
    const result = {
      elegiveis: elegiveis.length,
      sucesso,
      falha,
      neutras,
      circuit_abertos: circuitAbertos,
      duration_ms: durationMs,
    };

    await supabase.from("cron_job_logs").insert({
      job_name: "sefaz-dfe-dispatcher",
      executed_at: jobStartedAt,
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      success: falha === 0,
      result,
      error_message: falha > 0 ? `${falha} falha(s) reais` : null,
    });

    logger.info("dispatch_done", result);

    return new Response(
      JSON.stringify({ ok: true, ...result, results: summarize(results) }),
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("dispatch_failed", { error: message });
    await supabase.from("cron_job_logs").insert({
      job_name: "sefaz-dfe-dispatcher",
      executed_at: jobStartedAt,
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - t0,
      success: false,
      error_message: message,
    });
    return new Response(
      JSON.stringify({ ok: false, error: message, request_id: requestId }),
      { status: 500, headers },
    );
  }
});

async function invokePuller(
  supabase: ReturnType<typeof createClient>,
  e: EligibleCnpj,
  logger: ReturnType<typeof createLogger>,
  requestId: string,
): Promise<PullOutcome> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), PER_CNPJ_TIMEOUT_MS);
  try {
    const { data, error } = await supabase.functions.invoke("sefaz-dfe-puxar", {
      body: { cnpj: e.cnpj, ambiente: e.ambiente },
      headers: { "x-request-id": requestId },
    });
    if (error) {
      // Puxador ainda não deployado (Fase 2): falha neutra — não penaliza retry.
      const msg = error.message ?? String(error);
      const status = (error as { context?: { status?: number } })?.context?.status;
      if (status === 404 || /Function not found|does not exist/i.test(msg)) {
        logger.warn("puller_missing", { cnpj: e.cnpj });
        return { kind: "failure", neutral: true, errorTag: PULLER_MISSING_TAG };
      }
      return { kind: "failure", errorTag: msg.slice(0, 200) };
    }
    if (data && typeof data === "object" && "ok" in data && data.ok === false) {
      const tag = "errorTag" in data ? String(data.errorTag) : "puller-error";
      return { kind: "failure", errorTag: tag.slice(0, 200) };
    }
    return { kind: "success" };
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      return { kind: "failure", errorTag: "dispatcher-timeout" };
    }
    return {
      kind: "failure",
      errorTag: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    };
  } finally {
    clearTimeout(timer);
  }
}

function summarize(results: PromiseSettledResult<unknown>[]) {
  return {
    settled: results.length,
    rejected: results.filter((r) => r.status === "rejected").length,
  };
}
