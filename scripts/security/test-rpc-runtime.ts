#!/usr/bin/env bun
/**
 * Runtime privilege test — invoca cada RPC nfe_* e conciliacao_* via
 * `POST /rest/v1/rpc/<fn>` com identidades de aplicação restritas e valida o
 * comportamento contra a matriz esperada.
 *
 * Identidades:
 *   • anon           → Authorization: apikey anon
 *   • authenticated  → JWT real obtido via /auth/v1/token (E2E_USER_*)
 *
 * Escopo propositalmente restrito:
 *   • este probe prova apenas NEGATIVAS de ACL para `anon` e `authenticated`
 *   • `service_role` fica a cargo do gate SQL de ACL
 *     (scripts/security/test-observability-privileges.sql)
 *
 * Motivo: provar "allow" via REST com payload nulo aceita falsos positivos
 * (400/500 já dentro do corpo da função, inclusive efeitos parciais) e pode
 * encostar em mutações. Aqui o critério é estrito: sem EXECUTE o PostgREST
 * deve responder 404/PGRST202 ou um 403 de ACL do Postgres/PostgREST antes de
 * qualquer execução útil. Para `anon`, 401 do gateway também conta como bloqueio.
 *
 * Variáveis obrigatórias:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, E2E_USER_EMAIL, E2E_USER_PASSWORD
 *
 * Exit: 0 matriz conforme · 1 divergência · 2 variável ausente · 3 erro fatal
 * (rede, timeout, login do usuário E2E).
 * Testes: bun test scripts/security/test-rpc-runtime.evaluate.test.ts (lógica)
 *         python3 scripts/security/test_gates_http.py (ponta a ponta, servidor local)
 */

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Sem resposta em 30s a chamada aborta e o gate sai 3, em vez de pendurar o job.
const FETCH_TIMEOUT_MS = 30_000;

type Role = 'anon' | 'authenticated';

interface Expectation {
  fn: string;
  role: Role;
}

interface Result extends Expectation {
  status: number;
  code?: string;
  message?: string;
  ok: boolean;
}

interface EnvConfig {
  supabaseUrl: string;
  anonKey: string;
  e2eEmail: string;
  e2ePass: string;
}

interface RpcCallResult {
  status: number;
  code?: string;
  message?: string;
}

// RPCs monitoradas + params de matching de assinatura.
// O payload existe apenas para o PostgREST resolver a assinatura correta; o
// teste não tenta provar sucesso funcional nem EXECUTE por `service_role`.
const RPC_PARAMS: Record<string, Record<string, null>> = {
  nfe_apply_manifestacao: {
    p_chave: null,
    p_tipo_evento: null,
    p_codigo_evento: null,
    p_sequencial: null,
    p_data_evento: null,
    p_protocolo: null,
    p_justificativa: null,
    p_status_retorno: null,
    p_motivo_retorno: null,
    p_novo_status: null,
    p_raw: null,
  },
  nfe_create_conta_pagar_from_nfe: {
    p_nfe_id: null,
    p_data_vencimento: null,
    p_categoria_id: null,
  },
  nfe_link_conta_pagar: { p_nfe_id: null, p_conta_pagar_id: null },
  nfe_suggest_contas_pagar: { p_nfe_id: null },
  nfe_unlink_conta_pagar: { p_nfe_id: null },
  confirmar_conciliacao: {
    p_conciliacao_id: null,
    p_user_id: null,
    p_transacao_id: null,
    p_conta_pagar_id: null,
    p_conta_receber_id: null,
    p_ajuste_centavos: null,
  },
  confirmar_conciliacao_manual: {
    p_transacao_id: null,
    p_conta_pagar_id: null,
    p_conta_receber_id: null,
    p_ajuste_centavos: null,
  },
  desfazer_conciliacao: { p_conciliacao_id: null, p_transacao_id: null, p_user_id: null },
  desfazer_conciliacao_manual: { p_transacao_id: null },
  generate_reconciliation_suggestions: {
    p_empresa_id: null,
    p_transaction_date: null,
    p_transaction_value: null,
    p_transaction_id: null,
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

function buildExpectations(): Expectation[] {
  const list: Expectation[] = [];
  for (const fn of RPCS) {
    for (const role of ['anon', 'authenticated'] as Role[]) {
      list.push({ fn, role });
    }
  }
  return list;
}

async function getAuthenticatedToken(): Promise<string> {
  const { supabaseUrl, anonKey, e2eEmail, e2ePass } = getEnvConfig();
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: e2eEmail, password: e2ePass }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const body = await res
    .json()
    .catch(() => ({}) as { access_token?: string; error_description?: string });
  if (!res.ok || !body.access_token) {
    throw new Error(`Falha ao obter token authenticated: ${res.status} ${JSON.stringify(body)}`);
  }
  return body.access_token as string;
}

function getEnvConfig(): EnvConfig {
  return {
    supabaseUrl: mustEnv('SUPABASE_URL'),
    anonKey: mustEnv('SUPABASE_ANON_KEY'),
    e2eEmail: mustEnv('E2E_USER_EMAIL'),
    e2ePass: mustEnv('E2E_USER_PASSWORD'),
  };
}

async function callRpc(fn: string, role: Role, token: string): Promise<RpcCallResult> {
  const { supabaseUrl, anonKey } = getEnvConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(RPC_PARAMS[fn] ?? {}),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  let code: string | undefined;
  let message: string | undefined;
  try {
    const body = (await res.json()) as { code?: string; message?: string };
    code = body?.code;
    message = body?.message;
  } catch {
    // ignore — respostas 2xx sem body são válidas
  }
  return { status: res.status, code, message };
}

export function evaluate(role: Role, fn: string, result: RpcCallResult): boolean {
  // 404/PGRST202 indica função invisível ao papel por falta de EXECUTE.
  if (result.status === 404 && result.code === 'PGRST202') return true;

  // Para anon, 401 do gateway ainda conta como bloqueio legítimo.
  if (role === 'anon' && result.status === 401) return true;

  // 403 só conta quando a mensagem aponta explicitamente para a ACL da função
  // alvo, evitando aprovar 403 genérico emitido já dentro do corpo.
  if (result.status !== 403 || result.code !== '42501') return false;
  const normalized = (result.message ?? '').toLowerCase();
  // Postgres pode emitir o nome com ou sem aspas duplas: fn ou "fn"
  const bare = fn.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // O nome precisa terminar ali: sem a fronteira, `desfazer_conciliacao` aceitava
  // o 403 de `desfazer_conciliacao_manual`, emitido já DENTRO do corpo da função.
  return new RegExp(`permission denied for function (?:"${bare}"|${bare})(?![a-z0-9_$"])`).test(
    normalized
  );
}

async function main() {
  const { anonKey } = getEnvConfig();
  const authToken = await getAuthenticatedToken();
  const tokenByRole: Record<Role, string> = {
    anon: anonKey,
    authenticated: authToken,
  };

  const expectations = buildExpectations();
  const results: Result[] = [];

  for (const exp of expectations) {
    const result = await callRpc(exp.fn, exp.role, tokenByRole[exp.role]);
    results.push({ ...exp, ...result, ok: evaluate(exp.role, exp.fn, result) });
  }

  const fails = results.filter((r) => !r.ok);
  const pad = (s: string, n: number) => s.padEnd(n);

  console.log('\n=== Runtime RPC deny matrix ===');
  console.log(
    pad('fn', 42),
    pad('role', 15),
    pad('expected', 10),
    pad('status', 8),
    pad('code', 10),
    'result'
  );
  for (const r of results) {
    console.log(
      pad(r.fn, 42),
      pad(r.role, 15),
      pad('deny', 10),
      pad(String(r.status), 8),
      pad(r.code ?? '-', 10),
      r.ok ? 'PASS' : 'FAIL'
    );
  }

  console.log(
    `\nTotal: ${results.length} • PASS: ${results.length - fails.length} • FAIL: ${fails.length}`
  );

  if (fails.length > 0) {
    console.error('\n❌ Divergências detectadas:');
    for (const f of fails) {
      console.error(
        `  • ${f.fn} [${f.role}] esperado=bloqueado — resposta ${f.status}/${f.code ?? '-'}`
      );
    }
    await reportFailures(fails);
    process.exit(1);
  }

  console.log('✅ Todos os privilégios de runtime estão conforme esperado.');
}

async function reportFailures(fails: Result[]): Promise<void> {
  const { supabaseUrl, anonKey } = getEnvConfig();
  const secret = process.env.CI_GATE_LOG_SECRET;
  if (!secret) {
    console.warn('⚠️  CI_GATE_LOG_SECRET não definido — pulando registro remoto.');
    return;
  }
  const endpoint = `${supabaseUrl}/functions/v1/ci-security-gate-log`;
  // Campos ausentes vão como `undefined` (omitidos no JSON): o schema Zod de
  // ci-security-gate-log declara-os `.optional()` e rejeita `null` com 400.
  const payload = {
    git_sha: process.env.GITHUB_SHA || undefined,
    git_ref: process.env.GITHUB_REF || undefined,
    workflow_run_url:
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined,
    migration_revision: process.env.MIGRATION_REVISION || undefined,
    failures: fails.map((f) => ({
      matrix: 'rpc_runtime_privileges',
      function_name: f.fn,
      role_tested: f.role,
      expected_state: 'deny',
      observed_status: f.status,
      observed_code: f.code ?? null,
      severity: f.role === 'anon' ? 'critical' : 'error',
      exception_notes: null,
      raw: { message: f.message ?? null },
    })),
  };
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        'x-ci-gate-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`⚠️  Falha ao registrar evento no gate log: ${res.status} ${body}`);
    } else {
      console.log(`📝 Falhas registradas em ci_security_gate_events: ${body}`);
    }
  } catch (err) {
    console.error(
      '⚠️  Erro ao contactar ci-security-gate-log:',
      err instanceof Error ? err.message : err
    );
  }
}

// `new URL(import.meta.url).pathname` vem percent-encoded: com espaço ou acento
// no caminho do checkout a comparação falhava e o gate saía 0 sem executar nada.
function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  main().catch((err) => {
    console.error('💥 Erro fatal:', err instanceof Error ? err.message : err);
    process.exit(3);
  });
}
