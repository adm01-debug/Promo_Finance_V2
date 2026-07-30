#!/usr/bin/env bun
/**
 * Gap #25 — Probe HTTP de superfície anônima (regressão automática no CI).
 *
 * Este script transforma em teste determinístico a simulação manual que
 * detectou, no Gap #23, políticas `TO public` retornando 401 (42501) para
 * visitantes em vez de resultado vazio.
 *
 * O que ele faz:
 *   1. Executa `GET /rest/v1/<tabela>` com a identidade `anon` real.
 *   2. Executa `POST /rest/v1/<tabela>` (escrita) com a identidade `anon`.
 *   3. Executa `POST /rest/v1/rpc/<fn>` para RPCs administrativas.
 *
 * Modos esperados por alvo:
 *   • "empty"  → a tabela é visível ao PostgREST (GRANT SELECT existe) mas a
 *                RLS deve devolver **200 com array vazio**. Qualquer linha
 *                retornada é VAZAMENTO. Qualquer 401/403 indica regressão do
 *                Gap #23 (policy `TO public` chamando has_role sem EXECUTE).
 *   • "denied" → cofre de credenciais / tabela interna: o privilégio de tabela
 *                deve estar revogado para `anon` (401/403/404).
 *
 * Falhas 5xx nunca são aceitas: indicam erro dentro de policy/função.
 *
 * Variáveis obrigatórias: SUPABASE_URL, SUPABASE_ANON_KEY.
 * Opcional: CI_GATE_LOG_SECRET (registra falhas em ci_security_gate_events).
 */

type Mode = "empty" | "denied";

interface TableProbe {
  table: string;
  read: Mode;
  /** Escrita anônima é sempre negada, exceto telemetria explicitamente aberta. */
  writeAllowed?: boolean;
  writeBody?: Record<string, unknown>;
}

interface RpcProbe {
  fn: string;
  /** true → anon pode executar (função pública). */
  allowed: boolean;
  body?: Record<string, unknown>;
}

interface Failure {
  target: string;
  kind: "read" | "write" | "rpc";
  expected: string;
  observed: string;
}

const SUPABASE_URL = mustEnv("SUPABASE_URL");
const ANON_KEY = mustEnv("SUPABASE_ANON_KEY");

/**
 * Tabelas com dados de negócio: precisam responder 200 [] para anônimos.
 * Se alguma passar a devolver linhas, é exposição de dados.
 */
const TABLES: TableProbe[] = [
  { table: "profiles", read: "empty" },
  { table: "user_roles", read: "empty" },
  { table: "drivers", read: "empty" },
  { table: "clientes", read: "empty" },
  { table: "empresas", read: "empty" },
  { table: "fornecedores", read: "empty" },
  { table: "contas_pagar", read: "empty" },
  { table: "contas_receber", read: "empty" },
  { table: "lalamove_orders", read: "empty" },
  { table: "audit_logs", read: "empty" },
  // Telemetria: escrita anônima é intencional (GRANT INSERT em colunas
  // específicas — ver Gap #22). A leitura continua restrita pela RLS.
  {
    table: "frontend_error_logs",
    read: "empty",
    writeAllowed: true,
    writeBody: { error_message: "[ci-anon-surface-probe] canário de regressão", severity: "warning", url: "https://ci.local/anon-surface-probe" },
  },
  // Cofres de credenciais / estado interno — privilégio revogado para anon.
  { table: "api_keys", read: "denied" },
  { table: "bling_tokens", read: "denied" },
  { table: "bitrix_oauth_tokens", read: "denied" },
  { table: "bitrix24_tokens", read: "denied" },
  { table: "integration_secrets", read: "denied" },
  { table: "portal_cliente_tokens", read: "denied" },
  { table: "empresas_certificados", read: "denied" },
  { table: "frontend_error_alert_state", read: "denied" },
  { table: "lalamove_uapi_sessions", read: "denied" },
];

/** RPCs administrativas: nenhuma pode ser executada por anon. */
const RPCS: RpcProbe[] = [
  { fn: "get_frontend_error_groups", allowed: false },
  { fn: "get_frontend_error_occurrences", allowed: false },
  { fn: "claim_frontend_error_alerts", allowed: false },
  { fn: "get_cobertura_fiscal_uf", allowed: false },
  { fn: "get_catalogos_tributarios_health", allowed: false },
  { fn: "get_user_permissions", allowed: false },
  { fn: "export_asaas_audit_csv", allowed: false },
  { fn: "certificado_get_password", allowed: false },
];

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Variável obrigatória ausente: ${name}`);
    process.exit(2);
  }
  return v;
}

function anonHeaders(): Record<string, string> {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function readBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isDenied(status: number, code?: string): boolean {
  return status === 401 || status === 403 || (status === 404 && code === "PGRST202");
}

function codeOf(body: unknown): string | undefined {
  if (body && typeof body === "object" && "code" in body) {
    const c = (body as { code?: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

async function probeRead(p: TableProbe, failures: Failure[]): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${p.table}?select=*&limit=1`,
    { headers: anonHeaders() },
  );
  const body = await readBody(res);
  const code = codeOf(body);
  const observed = `${res.status}/${code ?? "-"}`;

  if (res.status >= 500) {
    failures.push({ target: p.table, kind: "read", expected: p.read, observed: `${observed} (erro interno)` });
    return;
  }

  if (p.read === "denied") {
    if (!isDenied(res.status, code)) {
      failures.push({ target: p.table, kind: "read", expected: "401/403 (privilégio revogado)", observed });
    }
    return;
  }

  // Modo "empty": exige 200 com array vazio.
  if (res.status !== 200) {
    failures.push({ target: p.table, kind: "read", expected: "200 []", observed });
    return;
  }
  if (Array.isArray(body) && body.length > 0) {
    failures.push({ target: p.table, kind: "read", expected: "200 [] (sem linhas)", observed: `200 com ${body.length} linha(s) — VAZAMENTO` });
  }
}

async function probeWrite(p: TableProbe, failures: Failure[]): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${p.table}`, {
    method: "POST",
    headers: anonHeaders(),
    body: JSON.stringify(p.writeBody ?? {}),
  });
  const body = await readBody(res);
  const code = codeOf(body);
  const observed = `${res.status}/${code ?? "-"}`;
  const accepted = res.status >= 200 && res.status < 300;

  if (p.writeAllowed) {
    if (isDenied(res.status, code)) {
      failures.push({ target: p.table, kind: "write", expected: "escrita permitida", observed });
    }
    return;
  }
  if (accepted) {
    failures.push({ target: p.table, kind: "write", expected: "escrita bloqueada", observed: `${observed} — ESCRITA ANÔNIMA ACEITA` });
  }
}

async function probeRpc(p: RpcProbe, failures: Failure[]): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${p.fn}`, {
    method: "POST",
    headers: anonHeaders(),
    body: JSON.stringify(p.body ?? {}),
  });
  const body = await readBody(res);
  const code = codeOf(body);
  const observed = `${res.status}/${code ?? "-"}`;
  const denied = isDenied(res.status, code);

  if (p.allowed && denied) {
    failures.push({ target: p.fn, kind: "rpc", expected: "execução permitida", observed });
  }
  if (!p.allowed && !denied) {
    failures.push({ target: p.fn, kind: "rpc", expected: "execução bloqueada", observed });
  }
}

async function reportFailures(failures: Failure[]): Promise<void> {
  const secret = process.env.CI_GATE_LOG_SECRET;
  if (!secret) {
    console.warn("⚠️  CI_GATE_LOG_SECRET não definido — pulando registro remoto.");
    return;
  }
  const payload = {
    git_sha: process.env.GITHUB_SHA ?? null,
    git_ref: process.env.GITHUB_REF ?? null,
    workflow_run_url:
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
    migration_revision: process.env.MIGRATION_REVISION ?? null,
    failures: failures.map((f) => ({
      matrix: "anon_http_surface",
      function_name: f.target,
      role_tested: "anon",
      expected_state: f.expected,
      observed_status: null,
      observed_code: f.observed,
    })),
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ci-security-gate-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ci-gate-secret": secret },
      body: JSON.stringify(payload),
    });
    console.warn(`ℹ️  Registro remoto do gate: HTTP ${res.status}`);
  } catch (err) {
    console.warn(`⚠️  Falha ao registrar gate remoto: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  const failures: Failure[] = [];
  let checks = 0;

  for (const t of TABLES) {
    await probeRead(t, failures);
    await probeWrite(t, failures);
    checks += 2;
  }
  for (const r of RPCS) {
    await probeRpc(r, failures);
    checks += 1;
  }

  console.log("\n=== Superfície anônima (HTTP probe) ===");
  console.log(`Alvos verificados: ${checks} • Falhas: ${failures.length}`);

  if (failures.length > 0) {
    console.error("\n❌ Regressões detectadas:");
    for (const f of failures) {
      console.error(`  • [${f.kind}] ${f.target} — esperado: ${f.expected} • observado: ${f.observed}`);
    }
    await reportFailures(failures);
    process.exit(1);
  }

  console.log("✅ Nenhum vazamento nem regressão de policy para a identidade anônima.");
}

main().catch((err) => {
  console.error(`❌ Erro inesperado no probe: ${(err as Error).message}`);
  process.exit(2);
});
