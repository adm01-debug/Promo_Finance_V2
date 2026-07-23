// Recebe eventos do gate de CI (falhas da matriz de privilégios RPC) e
// persiste em `public.ci_security_gate_events` via service_role.
// Autenticado por segredo compartilhado (X-CI-Gate-Secret) — NÃO usa JWT
// pois a chamada vem do runner do GitHub Actions, sem sessão de usuário.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-ci-gate-secret, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FailurePayload {
  matrix: string;
  function_name: string;
  role_tested: "anon" | "authenticated" | "service_role";
  expected_state: "allow" | "deny";
  observed_status?: number;
  observed_code?: string | null;
  observed_message?: string | null;
  exception_notes?: string | null;
  severity?: "info" | "warning" | "error" | "critical";
  raw?: Record<string, unknown>;
}

interface RequestBody {
  git_sha?: string;
  git_ref?: string;
  workflow_run_url?: string;
  migration_revision?: string;
  failures: FailurePayload[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const expected = Deno.env.get("CI_GATE_LOG_SECRET");
  const provided = req.headers.get("x-ci-gate-secret");
  if (!expected || !provided || !timingSafeEqual(expected, provided)) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!Array.isArray(body.failures)) {
    return json({ error: "failures_required" }, 400);
  }
  if (body.failures.length === 0) {
    return json({ inserted: 0, skipped: "no failures" }, 200);
  }
  if (body.failures.length > 500) {
    return json({ error: "too_many_failures", max: 500 }, 413);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const rows = body.failures.map((f) => ({
    matrix: String(f.matrix ?? "unknown"),
    function_name: String(f.function_name ?? "unknown"),
    role_tested: f.role_tested,
    expected_state: f.expected_state,
    observed_status: f.observed_status ?? null,
    observed_code: f.observed_code ?? null,
    observed_message: f.observed_message ?? null,
    migration_revision: body.migration_revision ?? null,
    git_sha: body.git_sha ?? null,
    git_ref: body.git_ref ?? null,
    workflow_run_url: body.workflow_run_url ?? null,
    exception_notes: f.exception_notes ?? null,
    severity: f.severity ?? "error",
    raw: f.raw ?? null,
  }));

  const { error, count } = await supabase
    .from("ci_security_gate_events")
    .insert(rows, { count: "exact" });

  if (error) {
    console.error("insert_failed", error);
    return json({ error: "insert_failed", details: error.message }, 500);
  }

  return json({ inserted: count ?? rows.length }, 201);
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
