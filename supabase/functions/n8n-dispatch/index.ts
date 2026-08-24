// n8n-dispatch — Roteia eventos para workflows n8n com filtros por score de risco.
// POST { event_type, risk_score?, payload, entity_id? }
// Busca configs em n8n_workflow_configs (enabled + faixa de risco compatível),
// envia webhook a cada uma com retry/backoff e loga em n8n_dispatch_logs.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-n8n-secret, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DispatchRequest {
  event_type: string;
  risk_score?: number;
  entity_id?: string;
  payload: Record<string, unknown>;
}

interface WorkflowConfig {
  id: string;
  name: string;
  event_type: string;
  webhook_url: string;
  enabled: boolean;
  min_risk_score: number;
  max_risk_score: number;
  filters: Record<string, unknown>;
  headers: Record<string, string>;
  retry_count: number;
  timeout_ms: number;
}

function matchesFilters(filters: Record<string, unknown>, payload: Record<string, unknown>): boolean {
  if (!filters || Object.keys(filters).length === 0) return true;
  for (const [k, v] of Object.entries(filters)) {
    if (Array.isArray(v)) {
      if (!v.includes(payload[k] as never)) return false;
    } else if (payload[k] !== v) {
      return false;
    }
  }
  return true;
}

async function dispatchWithRetry(
  cfg: WorkflowConfig,
  body: Record<string, unknown>,
): Promise<{ success: boolean; status?: number; text?: string; attempt: number; ms: number; error?: string }> {
  const start = Date.now();
  let lastErr = "";
  for (let attempt = 1; attempt <= Math.max(1, cfg.retry_count); attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.timeout_ms);
    try {
      const res = await fetch(cfg.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cfg.headers ?? {}) },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const text = await res.text().catch(() => "");
      if (res.ok) return { success: true, status: res.status, text, attempt, ms: Date.now() - start };
      lastErr = `HTTP ${res.status}: ${text.slice(0, 500)}`;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e instanceof Error ? e.message : String(e);
    }
    if (attempt < cfg.retry_count) await new Promise((r) => setTimeout(r, 500 * attempt));
  }
  return { success: false, attempt: cfg.retry_count, ms: Date.now() - start, error: lastErr };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const expected = Deno.env.get("N8N_DISPATCH_SECRET");
    if (!expected || req.headers.get("x-n8n-secret") !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json();
    const { z } = await import('https://deno.land/x/zod@v3.22.4/mod.ts');
    const { validatePayload, createErrorResponse } = await import('../_shared/validation.ts');
    const Schema = z.object({
      event_type: z.string().min(1),
      risk_score: z.number().optional(),
      entity_id: z.string().optional(),
      payload: z.record(z.any()),
    }).passthrough();
    const parsed = validatePayload(Schema, raw, 'n8n-dispatch');
    if (!parsed.success) return createErrorResponse(parsed.error, 400, parsed.details);
    const body = parsed.data as DispatchRequest;
    if (!body.event_type || !body.payload) {
      return new Response(JSON.stringify({ error: "event_type e payload são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const risk = typeof body.risk_score === "number" ? Math.max(0, Math.min(100, body.risk_score)) : 0;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: configs, error: cfgErr } = await supabase
      .from("n8n_workflow_configs")
      .select("*")
      .eq("enabled", true)
      .eq("event_type", body.event_type)
      .lte("min_risk_score", risk)
      .gte("max_risk_score", risk);

    if (cfgErr) throw new Error(`configs: ${cfgErr.message}`);
    const matched = (configs ?? []).filter((c) =>
      matchesFilters(c.filters as Record<string, unknown>, body.payload),
    ) as WorkflowConfig[];

    const enriched = {
      event_type: body.event_type,
      risk_score: risk,
      entity_id: body.entity_id ?? null,
      dispatched_at: new Date().toISOString(),
      source: "promo-finance-hub",
      data: body.payload,
    };

    const results = await Promise.all(
      matched.map(async (cfg) => {
        const r = await dispatchWithRetry(cfg, { ...enriched, workflow: { id: cfg.id, name: cfg.name } });
        await supabase.from("n8n_dispatch_logs").insert({
          config_id: cfg.id,
          event_type: body.event_type,
          risk_score: risk,
          payload: enriched,
          response_status: r.status ?? null,
          response_body: r.text?.slice(0, 2000) ?? null,
          success: r.success,
          attempt: r.attempt,
          duration_ms: r.ms,
          error: r.error ?? null,
        });
        return { workflow: cfg.name, success: r.success, status: r.status, attempts: r.attempt, error: r.error };
      }),
    );

    return new Response(
      JSON.stringify({ event_type: body.event_type, risk_score: risk, dispatched: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("n8n-dispatch error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
