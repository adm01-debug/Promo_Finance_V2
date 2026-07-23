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
  { fn: "nfe_suggest_contas_pagar", role: "authenticated", reason: "Migrado para nfe-vinculo-proxy", expiresAt: "2026-08-31" },
  { fn: "nfe_link_conta_pagar", role: "authenticated", reason: "Migrado para nfe-vinculo-proxy", expiresAt: "2026-08-31" },
  { fn: "nfe_unlink_conta_pagar", role: "authenticated", reason: "Migrado para nfe-vinculo-proxy", expiresAt: "2026-08-31" },
  { fn: "nfe_create_conta_pagar_from_nfe", role: "authenticated", reason: "Migrado para nfe-vinculo-proxy", expiresAt: "2026-08-31" },
  { fn: "confirmar_conciliacao_manual", role: "authenticated", reason: "Migrado para conciliacao-proxy", expiresAt: "2026-08-31" },
  { fn: "desfazer_conciliacao_manual", role: "authenticated", reason: "Migrado para conciliacao-proxy", expiresAt: "2026-08-31" },
  { fn: "confirmar_conciliacao", role: "authenticated", reason: "Fluxo legado; migrar para conciliacao-proxy", expiresAt: "2026-10-31" },
  { fn: "desfazer_conciliacao", role: "authenticated", reason: "Fluxo legado; migrar para conciliacao-proxy", expiresAt: "2026-10-31" },
  { fn: "generate_reconciliation_suggestions", role: "authenticated", reason: "Sugestões IA consumidas pelo painel", expiresAt: "2026-10-31" },
];

// RPCs monitoradas (sem assinatura — PostgREST usa o nome).
const RPCS = [
  "nfe_apply_manifestacao",
  "nfe_create_conta_pagar_from_nfe",
  "nfe_link_conta_pagar",
  "nfe_suggest_contas_pagar",
  "nfe_unlink_conta_pagar",
  "confirmar_conciliacao",
  "confirmar_conciliacao_manual",
  "desfazer_conciliacao",
  "desfazer_conciliacao_manual",
  "generate_reconciliation_suggestions",
];

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
    body: "{}",
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
  // PGRST202 = função não visível para o role atual (sem EXECUTE)
  const blocked = status === 404 && code === "PGRST202";
  const rejectedAuth = status === 401 || status === 403;
  const bypassed = !(blocked || rejectedAuth);
  return exp.allowed ? bypassed : !bypassed;
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
    process.exit(1);
  }

  console.log("✅ Todos os privilégios de runtime estão conforme esperado.");
}

main().catch((err) => {
  console.error("💥 Erro fatal:", err instanceof Error ? err.message : err);
  process.exit(3);
});
