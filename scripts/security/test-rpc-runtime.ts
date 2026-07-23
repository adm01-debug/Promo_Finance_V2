#!/usr/bin/env bun
/**
 * Runtime privilege test — invoca cada RPC nfe_* e conciliacao_* via
 * `POST /rest/v1/rpc/<fn>` com três identidades distintas e valida o
 * comportamento contra a matriz esperada.
 *
 * Identidades:
 *   • anon           → Authorization: apikey anon
 *   • authenticated  → JWT real obtido via /auth/v1/token (E2E_USER_*)
 *   • service_role   → Authorization: apikey + Bearer service_role
 *
 * Expectativa por (fn, role):
 *   • allowed = true  → PostgREST NÃO pode responder "função não encontrada"
 *                       (PGRST202/404). Qualquer outro status é aceito
 *                       (200/400/500) porque comprova que o gate de EXECUTE
 *                       foi ultrapassado.
 *   • allowed = false → resposta DEVE ser 404 com code PGRST202 (função
 *                       ocultada por falta de EXECUTE) OU 401/403.
 *
 * Exceções controladas: as 9 RPCs que legitimamente ainda mantêm EXECUTE para
 * `authenticated` (mesmas listadas em
 * scripts/security/test-observability-privileges.sql). Cada uma com data de
 * expiração — após ela, o teste passa a exigir bloqueio.
 *
 * Variáveis obrigatórias:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
 *   E2E_USER_EMAIL, E2E_USER_PASSWORD
 */

type Role = "anon" | "authenticated" | "service_role";

interface Expectation {
  fn: string;
  role: Role;
  allowed: boolean;
  reason?: string;
}

interface Result extends Expectation {
  status: number;
  code?: string;
  ok: boolean;
}

const SUPABASE_URL = mustEnv("SUPABASE_URL");
const ANON_KEY = mustEnv("SUPABASE_ANON_KEY");
const SERVICE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
const E2E_EMAIL = mustEnv("E2E_USER_EMAIL");
const E2E_PASS = mustEnv("E2E_USER_PASSWORD");

// Exceções controladas — mantenha sincronizado com _exceptions em
// scripts/security/test-observability-privileges.sql
const EXCEPTIONS: Array<{ fn: string; role: Role; reason: string; expiresAt: string }> = [
  // NF-e (nfe_suggest/link/unlink/create_conta_pagar_from_nfe), conciliação manual
  // (confirmar/desfazer_conciliacao_manual) e generate_reconciliation_suggestions
  // foram revogadas de authenticated — agora só rodam via proxies service_role.
  { fn: "confirmar_conciliacao", role: "authenticated", reason: "Fluxo legado; migrar para conciliacao-proxy", expiresAt: "2026-10-31" },
  { fn: "desfazer_conciliacao", role: "authenticated", reason: "Fluxo legado; migrar para conciliacao-proxy", expiresAt: "2026-10-31" },
];

// RPCs monitoradas + params esperados. PostgREST resolve a assinatura pelo
// conjunto de chaves recebidas — enviar todos os p_* como null garante que
// a função é encontrada e o gate de EXECUTE é o único obstáculo real.
const RPC_PARAMS: Record<string, Record<string, null>> = {
  nfe_apply_manifestacao: {
    p_chave: null, p_tipo_evento: null, p_codigo_evento: null, p_sequencial: null,
    p_data_evento: null, p_protocolo: null, p_justificativa: null,
    p_status_retorno: null, p_motivo_retorno: null, p_novo_status: null, p_raw: null,
  },
  nfe_create_conta_pagar_from_nfe: { p_nfe_id: null, p_data_vencimento: null, p_categoria_id: null },
  nfe_link_conta_pagar: { p_nfe_id: null, p_conta_pagar_id: null },
  nfe_suggest_contas_pagar: { p_nfe_id: null },
  nfe_unlink_conta_pagar: { p_nfe_id: null },
  confirmar_conciliacao: {
    p_conciliacao_id: null, p_user_id: null, p_transacao_id: null,
    p_conta_pagar_id: null, p_conta_receber_id: null, p_ajuste_centavos: null,
  },
  confirmar_conciliacao_manual: {
    p_transacao_id: null, p_conta_pagar_id: null, p_conta_receber_id: null, p_ajuste_centavos: null,
  },
  desfazer_conciliacao: { p_conciliacao_id: null, p_transacao_id: null, p_user_id: null },
  desfazer_conciliacao_manual: { p_transacao_id: null },
  generate_reconciliation_suggestions: {
    p_empresa_id: null, p_transaction_date: null, p_transaction_value: null, p_transaction_id: null,
  },
};

const RPCS = Object.keys(RPC_PARAMS);


function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Variável obrigatória ausente: ${name}`);
    process.exit(2);
  }
  return v;
}

function isActiveException(fn: string, role: Role): { active: boolean; reason?: string; expiresAt?: string } {
  const today = new Date().toISOString().slice(0, 10);
  const match = EXCEPTIONS.find((e) => e.fn === fn && e.role === role);
  if (!match) return { active: false };
  return { active: match.expiresAt >= today, reason: match.reason, expiresAt: match.expiresAt };
}

function buildExpectations(): Expectation[] {
  const list: Expectation[] = [];
  for (const fn of RPCS) {
    for (const role of ["anon", "authenticated", "service_role"] as Role[]) {
      let allowed = role === "service_role";
      let reason: string | undefined;
      if (role === "authenticated") {
        const ex = isActiveException(fn, role);
        if (ex.active) {
          allowed = true;
          reason = `${ex.reason} (expira em ${ex.expiresAt})`;
        }
      }
      list.push({ fn, role, allowed, reason });
    }
  }
  return list;
}

async function getAuthenticatedToken(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: E2E_EMAIL, password: E2E_PASS }),
  });
  const body = await res.json().catch(() => ({} as { access_token?: string; error_description?: string }));
  if (!res.ok || !body.access_token) {
    throw new Error(`Falha ao obter token authenticated: ${res.status} ${JSON.stringify(body)}`);
  }
  return body.access_token as string;
}

async function callRpc(fn: string, role: Role, token: string): Promise<{ status: number; code?: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: role === "service_role" ? SERVICE_KEY : ANON_KEY,
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify(RPC_PARAMS[fn] ?? {}),
  });
  let code: string | undefined;
  try {
    const body = (await res.json()) as { code?: string };
    code = body?.code;
  } catch {
    // ignore — respostas 2xx sem body são válidas
  }
  return { status: res.status, code };
}

function evaluate(exp: Expectation, status: number, code?: string): boolean {
  // "blocked" = PostgREST recusou por falta de EXECUTE (função invisível ao
  // role → PGRST202/404) ou o gateway rejeitou a chave (401). Erros 403 com
  // SQLSTATE 42501 emitidos DENTRO do corpo da função (ex.: guarda
  // `not_authenticated`) NÃO contam como bloqueio de EXECUTE — a função rodou.
  const blocked = (status === 404 && code === "PGRST202") || status === 401;
  return exp.allowed ? !blocked : blocked;
}


async function main() {
  const authToken = await getAuthenticatedToken();
  const tokenByRole: Record<Role, string> = {
    anon: ANON_KEY,
    authenticated: authToken,
    service_role: SERVICE_KEY,
  };

  const expectations = buildExpectations();
  const results: Result[] = [];

  for (const exp of expectations) {
    const { status, code } = await callRpc(exp.fn, exp.role, tokenByRole[exp.role]);
    results.push({ ...exp, status, code, ok: evaluate(exp, status, code) });
  }

  const fails = results.filter((r) => !r.ok);
  const pad = (s: string, n: number) => s.padEnd(n);

  console.log("\n=== Runtime RPC privilege matrix ===");
  console.log(pad("fn", 42), pad("role", 15), pad("expected", 10), pad("status", 8), pad("code", 10), "result");
  for (const r of results) {
    console.log(
      pad(r.fn, 42),
      pad(r.role, 15),
      pad(r.allowed ? "allow" : "deny", 10),
      pad(String(r.status), 8),
      pad(r.code ?? "-", 10),
      r.ok ? "PASS" : "FAIL",
      r.reason ? `— ${r.reason}` : "",
    );
  }

  console.log(`\nTotal: ${results.length} • PASS: ${results.length - fails.length} • FAIL: ${fails.length}`);

  if (fails.length > 0) {
    console.error("\n❌ Divergências detectadas:");
    for (const f of fails) {
      console.error(
        `  • ${f.fn} [${f.role}] esperado=${f.allowed ? "permitido" : "bloqueado"} — resposta ${f.status}/${f.code ?? "-"}`,
      );
    }
    await reportFailures(fails);
    process.exit(1);
  }

  console.log("✅ Todos os privilégios de runtime estão conforme esperado.");
}

async function reportFailures(fails: Result[]): Promise<void> {
  const secret = process.env.CI_GATE_LOG_SECRET;
  if (!secret) {
    console.warn("⚠️  CI_GATE_LOG_SECRET não definido — pulando registro remoto.");
    return;
  }
  const endpoint = `${SUPABASE_URL}/functions/v1/ci-security-gate-log`;
  const payload = {
    git_sha: process.env.GITHUB_SHA ?? null,
    git_ref: process.env.GITHUB_REF ?? null,
    workflow_run_url:
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
    migration_revision: process.env.MIGRATION_REVISION ?? null,
    failures: fails.map((f) => ({
      matrix: "rpc_runtime_privileges",
      function_name: f.fn,
      role_tested: f.role,
      expected_state: f.allowed ? "allow" : "deny",
      observed_status: f.status,
      observed_code: f.code ?? null,
      severity: f.role === "anon" ? "critical" : "error",
      exception_notes: f.reason ?? null,
      raw: { reason: f.reason ?? null },
    })),
  };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        "x-ci-gate-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`⚠️  Falha ao registrar evento no gate log: ${res.status} ${body}`);
    } else {
      console.log(`📝 Falhas registradas em ci_security_gate_events: ${body}`);
    }
  } catch (err) {
    console.error("⚠️  Erro ao contactar ci-security-gate-log:", err instanceof Error ? err.message : err);
  }
}


main().catch((err) => {
  console.error("💥 Erro fatal:", err instanceof Error ? err.message : err);
  process.exit(3);
});
