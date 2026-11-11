import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ALLOWED_ANON_WRITE_GRANTS,
  ALLOWED_LITERAL_TRUE_POLICIES,
  EXPECTED_FIXED_POLICIES,
  EXPECTED_FUNCTION_PRIVILEGES,
  REQUIRED_MIGRATIONS,
  evaluateAnonWriteGrants,
  evaluateFixedPolicies,
  evaluateFunctionPrivileges,
  evaluateLiteralTruePolicies,
  evaluatePerformanceAlertConstraint,
  evaluateRequiredMigrations,
  hasTrueDisjunction,
  pendingPrMigrations,
  queryReadOnlyCatalog,
  readEnv,
  runCanonicalDbGates,
} from "./test-canonical-db-gates.mjs";

test("evaluateRequiredMigrations falha quando uma migration obrigatória some", () => {
  const rows = REQUIRED_MIGRATIONS.slice(0, -1).map((version) => ({ version }));
  assert.throws(() => evaluateRequiredMigrations(rows), /20260912100000/);
});

test("evaluateRequiredMigrations tolera migration introduzida pelo próprio PR", () => {
  // Deadlock original: a migration nova só chega ao canônico depois do merge,
  // então o PR que a adiciona não conseguia passar no próprio gate.
  // Fixture sintética: a versão NÃO pode constar em REQUIRED_MIGRATIONS —
  // 20260912100000 passou a ser obrigatória (PR #79) e quebrava a premissa.
  const novaVersao = "20269999000000";
  const required = [...REQUIRED_MIGRATIONS, novaVersao];
  const rows = REQUIRED_MIGRATIONS.map((version) => ({ version }));

  assert.throws(() => evaluateRequiredMigrations(rows, required), /20269999000000/);

  const resultado = evaluateRequiredMigrations(rows, required, new Set([novaVersao]));
  assert.deepEqual(resultado.pendingFromPr, [novaVersao]);
});

test("evaluateRequiredMigrations ainda falha para migration ausente que o PR não introduziu", () => {
  const novaVersao = "20269999000000";
  const required = [...REQUIRED_MIGRATIONS, novaVersao];
  // Remove explicitamente a versão citada — o antigo slice(0, -1) quebrava
  // quando 20260912100000 passou a ser a última da lista (PR #79).
  const rows = REQUIRED_MIGRATIONS.filter((version) => version !== "20260826050000").map(
    (version) => ({ version }),
  );

  // O PR introduz a nova, mas 20260826050000 sumiu do canônico: isso é falha real.
  assert.throws(
    () => evaluateRequiredMigrations(rows, required, new Set([novaVersao])),
    /20260826050000/,
  );
});

test("pendingPrMigrations extrai versões dos arquivos adicionados pelo PR", () => {
  const fakeGit = () =>
    [
      "supabase/migrations/20260912100000_revoke_anon_admin_observability_rpcs.sql",
      "supabase/migrations/20260913120000_outra.sql",
      "supabase/migrations/README.md",
    ].join("\n");

  const versoes = pendingPrMigrations({ GITHUB_BASE_REF: "main" }, fakeGit);
  assert.deepEqual([...versoes].sort(), ["20260912100000", "20260913120000"]);
});

test("pendingPrMigrations é vazio fora de um PR", () => {
  assert.equal(pendingPrMigrations({}, () => "").size, 0);
});

test("evaluateFunctionPrivileges rejeita fail-open por PUBLIC e ausência de função", () => {
  const functionRows = EXPECTED_FUNCTION_PRIVILEGES.slice(1).map((entry) => ({ function_name: entry.functionName }));
  const grantRows = EXPECTED_FUNCTION_PRIVILEGES.flatMap((entry) => [
    { function_name: entry.functionName, grantee: "service_role" },
    { function_name: entry.functionName, grantee: "PUBLIC" },
  ]);

  assert.throws(
    () => evaluateFunctionPrivileges(functionRows, grantRows),
    /Funções sensíveis ausentes|ACL divergente em funções sensíveis/,
  );
});

test("evaluateFixedPolicies detecta policy corrigida quebrada", () => {
  const rows = EXPECTED_FIXED_POLICIES.map((entry) => ({
    tablename: entry.tableName,
    policyname: entry.policyName,
    cmd: entry.cmd,
    roles_csv: entry.rolesCsv,
    qual: entry.policyName === "sso_sandbox_runs_admin" ? "has_role(auth.uid(), 'admin'::app_role)" : "user_id = auth.uid()",
    with_check: entry.policyName === "sso_sandbox_runs_admin" ? "has_role(auth.uid(), 'admin'::app_role)" : "user_id = auth.uid()",
  }));

  assert.throws(() => evaluateFixedPolicies(rows), /created_by = auth.uid\(\)/);
});

test("evaluateLiteralTruePolicies exige allowlist exata sem extras nem ausências", () => {
  const actual = ALLOWED_LITERAL_TRUE_POLICIES.slice(1).concat([
    { tableName: "qualquer_tabela", policyName: "policy_aberta", cmd: "SELECT", rolesCsv: "authenticated" },
  ]);

  assert.throws(() => evaluateLiteralTruePolicies(actual), /extras:|ausentes:/);
});

test("evaluateAnonWriteGrants permite só o grant anônimo explicitamente aprovado", () => {
  const actual = ALLOWED_ANON_WRITE_GRANTS.concat([
    { tableName: "audit_logs", grantee: "PUBLIC", privilegeType: "INSERT" },
  ]);

  assert.throws(() => evaluateAnonWriteGrants(actual), /audit_logs:INSERT:PUBLIC|extras:/);
});

test("evaluatePerformanceAlertConstraint falha sem cron", () => {
  assert.throws(
    () => evaluatePerformanceAlertConstraint([{ definition: "CHECK (source IN ('query_telemetry','pg_stat_statements'))" }]),
    /cron/,
  );
});

test("runCanonicalDbGates valida snapshot offline consistente", async () => {
  const fetchImpl = buildFetchMock({
    migrations: REQUIRED_MIGRATIONS.map((version) => ({ version })),
    functionRows: EXPECTED_FUNCTION_PRIVILEGES.map((entry) => ({ function_name: entry.functionName })),
    functionGrantRows: EXPECTED_FUNCTION_PRIVILEGES.flatMap((entry) => {
      const grants = [{ function_name: entry.functionName, grantee: "service_role" }];
      if (entry.expected.authenticated) {
        grants.push({ function_name: entry.functionName, grantee: "authenticated" });
      }
      return grants;
    }),
    fixedPolicies: EXPECTED_FIXED_POLICIES.map((entry) => ({
      tablename: entry.tableName,
      policyname: entry.policyName,
      cmd: entry.cmd,
      roles_csv: entry.rolesCsv,
      qual: sampleQual(entry.policyName),
      with_check: sampleWithCheck(entry.policyName),
    })),
    literalTruePolicies: ALLOWED_LITERAL_TRUE_POLICIES.map((entry) => ({
      tablename: entry.tableName,
      policyname: entry.policyName,
      cmd: entry.cmd,
      roles_csv: entry.rolesCsv,
    })),
    constraintRows: [
      {
        definition: "CHECK (source IN ('query_telemetry', 'pg_stat_statements', 'cron'))",
      },
    ],
    anonWriteGrants: ALLOWED_ANON_WRITE_GRANTS.map((entry) => ({
      tablename: entry.tableName,
      grantee: entry.grantee,
      privilege_type: entry.privilegeType,
    })),
  });

  const summary = await runCanonicalDbGates({
    env: {
      SUPABASE_ACCESS_TOKEN: "token-super-secreto",
      SUPABASE_PROJECT_REF: "bwwbeyolnnzppeuhgkcd",
    },
    fetchImpl,
  });

  assert.equal(summary.projectRef, "bwwbeyolnnzppeuhgkcd");
  assert.equal(summary.migrations.checked, 6);
  assert.equal(summary.functions.checked, EXPECTED_FUNCTION_PRIVILEGES.length);
  assert.equal(summary.literalTruePolicies.checked, ALLOWED_LITERAL_TRUE_POLICIES.length);
});

test("runCanonicalDbGates falha fechado em erro HTTP sem vazar token", async () => {
  const fetchImpl = async () => ({
    status: 401,
    async text() {
      return JSON.stringify({ message: "unauthorized" });
    },
  });

  await assert.rejects(
    () =>
      runCanonicalDbGates({
        env: {
          SUPABASE_ACCESS_TOKEN: "token-super-secreto",
          SUPABASE_PROJECT_REF: "bwwbeyolnnzppeuhgkcd",
        },
        fetchImpl,
      }),
    (error) => {
      assert.match(error.message, /HTTP 401/);
      assert.doesNotMatch(error.message, /token-super-secreto/);
      return true;
    },
  );
});

// ---------------------------------------------------------------------------
// Cada avaliador isolado: um único desvio por caso, para que nenhum fique
// escondido atrás de outro que também reprovaria.
// ---------------------------------------------------------------------------

const ENV_OK = { SUPABASE_ACCESS_TOKEN: "token-super-secreto", SUPABASE_PROJECT_REF: "bwwbeyolnnzppeuhgkcd" };

function snapshotSao() {
  return {
    migrations: REQUIRED_MIGRATIONS.map((version) => ({ version })),
    functionRows: EXPECTED_FUNCTION_PRIVILEGES.map((entry) => ({ function_name: entry.functionName })),
    functionGrantRows: EXPECTED_FUNCTION_PRIVILEGES.flatMap((entry) =>
      Object.entries(entry.expected)
        .filter(([, permitido]) => permitido)
        .map(([grantee]) => ({ function_name: entry.functionName, grantee })),
    ),
    fixedPolicies: EXPECTED_FIXED_POLICIES.map((entry) => ({
      tablename: entry.tableName,
      policyname: entry.policyName,
      cmd: entry.cmd,
      roles_csv: entry.rolesCsv,
      qual: sampleQual(entry.policyName),
      with_check: sampleWithCheck(entry.policyName),
    })),
    literalTruePolicies: ALLOWED_LITERAL_TRUE_POLICIES.map((entry) => ({
      tablename: entry.tableName,
      policyname: entry.policyName,
      cmd: entry.cmd,
      roles_csv: entry.rolesCsv,
    })),
    constraintRows: [{ definition: "CHECK (source IN ('query_telemetry', 'pg_stat_statements', 'cron'))" }],
    anonWriteGrants: ALLOWED_ANON_WRITE_GRANTS.map((entry) => ({
      tablename: entry.tableName,
      grantee: entry.grantee,
      privilege_type: entry.privilegeType,
    })),
  };
}

test("snapshot são aprova em cada avaliador isolado", () => {
  const s = snapshotSao();
  assert.equal(evaluateRequiredMigrations(s.migrations).checked, REQUIRED_MIGRATIONS.length);
  assert.equal(evaluateFunctionPrivileges(s.functionRows, s.functionGrantRows).checked, EXPECTED_FUNCTION_PRIVILEGES.length);
  assert.equal(evaluateFixedPolicies(s.fixedPolicies).checked, EXPECTED_FIXED_POLICIES.length);
  assert.equal(evaluateLiteralTruePolicies(s.literalTruePolicies).checked, ALLOWED_LITERAL_TRUE_POLICIES.length);
  assert.equal(evaluateAnonWriteGrants(s.anonWriteGrants).checked, ALLOWED_ANON_WRITE_GRANTS.length);
  assert.equal(evaluatePerformanceAlertConstraint(s.constraintRows).checked, 1);
});

test("evaluateFunctionPrivileges reprova cada desvio de ACL isoladamente", () => {
  const alvo = EXPECTED_FUNCTION_PRIVILEGES[0].functionName;
  const adminClient = EXPECTED_FUNCTION_PRIVILEGES.find((entry) => entry.expected.authenticated).functionName;
  const s = snapshotSao();
  const com = (grantee, fn = alvo) => s.functionGrantRows.concat([{ function_name: fn, grantee }]);
  const sem = (grantee, fn) => s.functionGrantRows.filter((row) => !(row.function_name === fn && row.grantee === grantee));

  assert.throws(() => evaluateFunctionPrivileges(s.functionRows, com("PUBLIC")), /PUBLIC=true \(esperado false\)/);
  assert.throws(() => evaluateFunctionPrivileges(s.functionRows, com("anon")), /anon=true \(esperado false\)/);
  assert.throws(() => evaluateFunctionPrivileges(s.functionRows, com("authenticated")), /authenticated=true \(esperado false\)/);
  assert.throws(() => evaluateFunctionPrivileges(s.functionRows, com("anon", adminClient)), /anon=true/);
  assert.throws(() => evaluateFunctionPrivileges(s.functionRows, sem("service_role", alvo)), /service_role=false \(esperado true\)/);
  assert.throws(() => evaluateFunctionPrivileges(s.functionRows, sem("authenticated", adminClient)), /authenticated=false \(esperado true\)/);
  assert.throws(() => evaluateFunctionPrivileges(s.functionRows.slice(1), s.functionGrantRows), /Funções sensíveis ausentes/);
  assert.throws(() => evaluateFunctionPrivileges([], []), /Funções sensíveis ausentes/);
  // Grants de outras funções/papéis não interferem.
  evaluateFunctionPrivileges(
    s.functionRows,
    s.functionGrantRows.concat([
      { function_name: "public.outra()", grantee: "PUBLIC" },
      { function_name: alvo, grantee: "postgres" },
    ]),
  );
});

test("evaluateFixedPolicies reprova ausência, papel divergente e predicado anulado por OR true", () => {
  const s = snapshotSao();
  const mutar = (policyName, patch) =>
    s.fixedPolicies.map((row) => (row.policyname === policyName ? { ...row, ...patch } : row));

  assert.throws(() => evaluateFixedPolicies(s.fixedPolicies.slice(1)), /kpis_operacionais\.kpis_operacionais_owner ausente/);
  assert.throws(() => evaluateFixedPolicies([]), /ausente/);
  assert.throws(() => evaluateFixedPolicies(mutar("scim_checklist_own", { roles_csv: "public" })), /roles=public/);
  assert.throws(() => evaluateFixedPolicies(mutar("scim_checklist_own", { roles_csv: "anon,authenticated" })), /roles=anon,authenticated/);
  assert.throws(() => evaluateFixedPolicies(mutar("scim_checklist_own", { qual: "true" })), /qual sem "user_id = auth\.uid\(\)"/);
  assert.throws(() => evaluateFixedPolicies(mutar("scim_checklist_own", { with_check: null })), /with_check sem/);
  // Regressão: o fragmento esperado está presente, mas o predicado libera tudo.
  for (const anulado of [
    "((user_id = auth.uid()) OR true)",
    "(true OR (user_id = auth.uid()))",
    "((user_id = auth.uid())\n  or ( TRUE ))",
  ]) {
    assert.throws(() => evaluateFixedPolicies(mutar("kpis_operacionais_owner", { qual: anulado })), /qual anulado por "OR true"/, anulado);
    assert.throws(() => evaluateFixedPolicies(mutar("kpis_operacionais_owner", { with_check: anulado })), /with_check anulado por "OR true"/, anulado);
  }
  // Espaços, aspas e caixa do deparser do Postgres não geram falso vermelho.
  evaluateFixedPolicies(mutar("kpis_operacionais_owner", { qual: '("USER_ID"   =   auth.uid())', roles_csv: " authenticated " }));
});

test("hasTrueDisjunction não acusa identificadores nem conjunções", () => {
  for (const ok of ["user_id = auth.uid()", "(ativo = true) AND (user_id = auth.uid())", "sensor_true = 1", "(valor_true OR outro)", null, ""]) {
    assert.equal(hasTrueDisjunction(ok), false, String(ok));
  }
  for (const ruim of ["a OR true", "TRUE OR a", "(a) OR (true)", "a or\ttrue"]) {
    assert.equal(hasTrueDisjunction(ruim), true, ruim);
  }
});

test("evaluateLiteralTruePolicies reprova extra, ausência e troca de papel/comando isoladamente", () => {
  const s = snapshotSao();
  const extra = { tablename: "contas_pagar", policyname: "aberta", cmd: "SELECT", roles_csv: "authenticated" };
  assert.throws(() => evaluateLiteralTruePolicies(s.literalTruePolicies.concat([extra])), /extras: contas_pagar\.aberta\./);
  assert.throws(() => evaluateLiteralTruePolicies(s.literalTruePolicies.slice(1)), /ausentes: allowed_countries\.Public read\./);
  const trocar = (patch) => s.literalTruePolicies.map((row, i) => (i === 0 ? { ...row, ...patch } : row));
  assert.throws(() => evaluateLiteralTruePolicies(trocar({ roles_csv: "anon,authenticated" })), /extras:.*ausentes:/);
  assert.throws(() => evaluateLiteralTruePolicies(trocar({ roles_csv: "public" })), /extras:/);
  assert.throws(() => evaluateLiteralTruePolicies(trocar({ cmd: "ALL" })), /extras:/);
  assert.throws(() => evaluateLiteralTruePolicies([]), /ausentes:/);
  // A ordem dos papéis devolvida pelo catálogo é irrelevante.
  evaluateLiteralTruePolicies(
    [{ tableName: "t", policyName: "p", cmd: "SELECT", rolesCsv: "b, a" }],
    [{ tableName: "t", policyName: "p", cmd: "SELECT", rolesCsv: "a,b" }],
  );
});

test("evaluateAnonWriteGrants reprova extra e ausência isoladamente", () => {
  const s = snapshotSao();
  for (const extra of [
    { tablename: "audit_logs", grantee: "anon", privilege_type: "INSERT" },
    { tablename: "frontend_error_logs", grantee: "anon", privilege_type: "UPDATE" },
    { tablename: "frontend_error_logs", grantee: "PUBLIC", privilege_type: "INSERT" },
    { tablename: "clientes", grantee: "PUBLIC", privilege_type: "TRUNCATE" },
  ]) {
    assert.throws(
      () => evaluateAnonWriteGrants(s.anonWriteGrants.concat([extra])),
      new RegExp(`extras: ${extra.tablename}:${extra.privilege_type}:${extra.grantee}\\.`),
    );
  }
  assert.throws(() => evaluateAnonWriteGrants([]), /ausentes: frontend_error_logs:INSERT:anon/);
});

test("evaluatePerformanceAlertConstraint exige exatamente uma linha com os três valores", () => {
  const ok = "CHECK (source = ANY (ARRAY['query_telemetry'::text, 'pg_stat_statements'::text, 'cron'::text]))";
  assert.equal(evaluatePerformanceAlertConstraint([{ definition: ok }]).checked, 1);
  assert.throws(() => evaluatePerformanceAlertConstraint([]), /recebidas 0/);
  assert.throws(() => evaluatePerformanceAlertConstraint([{ definition: ok }, { definition: ok }]), /recebidas 2/);
  assert.throws(() => evaluatePerformanceAlertConstraint([{ definition: null }]), /query_telemetry/);
  assert.throws(() => evaluatePerformanceAlertConstraint([{ definition: ok.replace("pg_stat_statements", "x") }]), /pg_stat_statements/);
});

test("evaluateRequiredMigrations não aceita versão parecida e ignora pendência fora da lista", () => {
  const rows = REQUIRED_MIGRATIONS.map((version) => ({ version }));
  assert.throws(() => evaluateRequiredMigrations([]), new RegExp(REQUIRED_MIGRATIONS.join(", ")));
  assert.throws(
    () => evaluateRequiredMigrations(rows.slice(1).concat([{ version: `${REQUIRED_MIGRATIONS[0]}0` }])),
    new RegExp(REQUIRED_MIGRATIONS[0]),
  );
  // Versão numérica devolvida pela API é comparada como texto.
  assert.equal(evaluateRequiredMigrations(rows.map((row) => ({ version: Number(row.version) }))).checked, rows.length);
  const resultado = evaluateRequiredMigrations(rows, REQUIRED_MIGRATIONS, new Set(["20999999999999"]));
  assert.deepEqual(resultado.pendingFromPr, []);
});

test("pendingPrMigrations é estrito quando o git falha ou devolve lixo", () => {
  const quebrado = () => {
    throw new Error("fatal: bad revision");
  };
  assert.equal(pendingPrMigrations({ GITHUB_BASE_REF: "main" }, quebrado).size, 0);
  assert.equal(pendingPrMigrations({ GITHUB_BASE_REF: "" }, quebrado).size, 0);
  const lixo = () => ["", "supabase/migrations/sem_versao.sql", "supabase/migrations/2026_x.sql", "  "].join("\n");
  assert.equal(pendingPrMigrations({ GITHUB_BASE_REF: "main" }, lixo).size, 0);
  let argsRecebidos;
  pendingPrMigrations({ GITHUB_BASE_REF: "release/x y" }, (args) => {
    argsRecebidos = args;
    return "";
  });
  assert.ok(argsRecebidos.includes("origin/release/x y...HEAD"));
  assert.ok(argsRecebidos.includes("--diff-filter=A"));
});

test("readEnv recusa variável ausente e projeto que não é o canônico", () => {
  assert.throws(() => readEnv({}), /SUPABASE_ACCESS_TOKEN ausente/);
  assert.throws(() => readEnv({ SUPABASE_ACCESS_TOKEN: "" , SUPABASE_PROJECT_REF: "x" }), /SUPABASE_ACCESS_TOKEN ausente/);
  assert.throws(() => readEnv({ SUPABASE_ACCESS_TOKEN: "t" }), /SUPABASE_PROJECT_REF ausente/);
  assert.throws(
    () => readEnv({ SUPABASE_ACCESS_TOKEN: "token-super-secreto", SUPABASE_PROJECT_REF: "pgxfvjmuubtbowutlide" }),
    (error) => /Projeto incorreto/.test(error.message) && !error.message.includes("token-super-secreto"),
  );
  assert.deepEqual(readEnv(ENV_OK), { accessToken: ENV_OK.SUPABASE_ACCESS_TOKEN, projectRef: ENV_OK.SUPABASE_PROJECT_REF });
});

test("queryReadOnlyCatalog falha fechado em resposta malformada e só consulta o endpoint read-only", async () => {
  const chamadas = [];
  const base = { accessToken: "token-super-secreto", projectRef: "bwwbeyolnnzppeuhgkcd", queryName: "q", sql: "SELECT 1" };
  const com = (status, corpo) => async (url, init) => {
    chamadas.push({ url, init });
    return { status, text: async () => corpo };
  };

  assert.deepEqual(await queryReadOnlyCatalog({ ...base, fetchImpl: com(201, "[]") }), []);
  assert.deepEqual(await queryReadOnlyCatalog({ ...base, fetchImpl: com(200, '[{"a":1}]') }), [{ a: 1 }]);
  await assert.rejects(() => queryReadOnlyCatalog({ ...base, fetchImpl: com(200, "<html>") }), /JSON inválido com HTTP 200/);
  await assert.rejects(() => queryReadOnlyCatalog({ ...base, fetchImpl: com(200, "") }), /formato inesperado/);
  await assert.rejects(() => queryReadOnlyCatalog({ ...base, fetchImpl: com(200, '{"rows":[]}') }), /formato inesperado/);
  await assert.rejects(() => queryReadOnlyCatalog({ ...base, fetchImpl: com(500, "{}") }), /HTTP 500: sem detalhe/);
  await assert.rejects(() => queryReadOnlyCatalog({ ...base, fetchImpl: com(403, '{"message":"Forbidden"}') }), /HTTP 403: Forbidden/);
  await assert.rejects(
    () => queryReadOnlyCatalog({ ...base, fetchImpl: async () => { throw new Error("fetch failed"); } }),
    (error) => !error.message.includes("token-super-secreto"),
  );

  for (const { url, init } of chamadas) {
    assert.equal(url, "https://api.supabase.com/v1/projects/bwwbeyolnnzppeuhgkcd/database/query/read-only");
    assert.equal(init.method, "POST");
    assert.ok(init.signal instanceof AbortSignal, "consulta sem timeout");
  }
});

test("runCanonicalDbGates reprova cada consulta adulterada do snapshot", async () => {
  const casos = {
    migrations: [(s) => { s.migrations = s.migrations.slice(1); }, /Migrations obrigatórias ausentes/],
    functionRows: [(s) => { s.functionRows = s.functionRows.slice(1); }, /Funções sensíveis ausentes/],
    functionGrantRows: [(s) => { s.functionGrantRows.push({ function_name: EXPECTED_FUNCTION_PRIVILEGES[3].functionName, grantee: "PUBLIC" }); }, /ACL divergente/],
    fixedPolicies: [(s) => { s.fixedPolicies[0].qual = "true"; }, /Policies corrigidas divergentes/],
    literalTruePolicies: [(s) => { s.literalTruePolicies.push({ tablename: "clientes", policyname: "aberta", cmd: "ALL", roles_csv: "authenticated" }); }, /literal-true fora do baseline/],
    constraintRows: [(s) => { s.constraintRows = []; }, /performance_alerts_source_check/],
    anonWriteGrants: [(s) => { s.anonWriteGrants.push({ tablename: "clientes", grantee: "anon", privilege_type: "DELETE" }); }, /Grants de escrita anônima fora do baseline/],
  };
  await runCanonicalDbGates({ env: ENV_OK, fetchImpl: buildFetchMock(snapshotSao()) });
  for (const [nome, [adulterar, mensagem]] of Object.entries(casos)) {
    const snapshot = snapshotSao();
    adulterar(snapshot);
    await assert.rejects(() => runCanonicalDbGates({ env: ENV_OK, fetchImpl: buildFetchMock(snapshot) }), mensagem, nome);
  }
  await assert.rejects(() => runCanonicalDbGates({ env: ENV_OK, fetchImpl: null }), /fetch indisponível/);
  await assert.rejects(() => runCanonicalDbGates({ env: {}, fetchImpl: buildFetchMock(snapshotSao()) }), /SUPABASE_ACCESS_TOKEN ausente/);
});

test("execução direta roda o gate mesmo quando o script é chamado por symlink", () => {
  // Regressão: por um caminho com symlink a detecção de "execução direta"
  // falhava e o gate live saía 0 sem consultar nada.
  const script = join(dirname(fileURLToPath(import.meta.url)), "test-canonical-db-gates.mjs");
  const dir = mkdtempSync(join(tmpdir(), "gate canônico "));
  try {
    const atalho = join(dir, "atalho.mjs");
    symlinkSync(script, atalho);
    const env = { PATH: process.env.PATH ?? "" };
    for (const caminho of [script, atalho]) {
      const r = spawnSync(process.execPath, [caminho], { encoding: "utf8", env });
      assert.equal(r.status, 1, `${caminho}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, /❌ SUPABASE_ACCESS_TOKEN ausente\./);
    }
    const errado = spawnSync(process.execPath, [atalho], {
      encoding: "utf8",
      env: { ...env, SUPABASE_ACCESS_TOKEN: "token-super-secreto", SUPABASE_PROJECT_REF: "outro" },
    });
    assert.equal(errado.status, 1);
    assert.match(errado.stderr, /Projeto incorreto/);
    assert.doesNotMatch(errado.stdout + errado.stderr, /token-super-secreto/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function buildFetchMock(payloads) {
  return async (_url, init) => {
    const body = JSON.parse(init.body);
    const query = body.query;

    if (query.includes("supabase_migrations.schema_migrations")) {
      return jsonResponse(payloads.migrations);
    }
    if (query.includes("acl.privilege_type = 'EXECUTE'")) {
      return jsonResponse(payloads.functionGrantRows);
    }
    if (query.includes("pg_catalog.pg_get_function_identity_arguments")) {
      return jsonResponse(payloads.functionRows);
    }
    if (query.includes("performance_alerts_source_check")) {
      return jsonResponse(payloads.constraintRows);
    }
    if (query.includes("pg_catalog.btrim(COALESCE(qual, ''))")) {
      return jsonResponse(payloads.literalTruePolicies);
    }
    if (query.includes("acl.privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')")) {
      return jsonResponse(payloads.anonWriteGrants);
    }
    if (query.includes("pg_catalog.pg_policies")) {
      return jsonResponse(payloads.fixedPolicies);
    }

    throw new Error(`Query não mockada: ${query}`);
  };
}

function jsonResponse(data, status = 201) {
  return {
    status,
    async text() {
      return JSON.stringify(data);
    },
  };
}

function sampleQual(policyName) {
  switch (policyName) {
    case "sim_trib_acesso":
      return "EXISTS (SELECT 1 FROM simulacoes s WHERE s.id = simulacao_tributos_detalhados.simulacao_id AND empresa_acessivel(s.empresa_id))";
    case "sso_sandbox_runs_admin":
      return "has_role(auth.uid(), 'admin'::app_role)";
    default:
      return "user_id = auth.uid()";
  }
}

function sampleWithCheck(policyName) {
  switch (policyName) {
    case "sim_trib_acesso":
      return "EXISTS (SELECT 1 FROM simulacoes s WHERE s.id = simulacao_tributos_detalhados.simulacao_id AND empresa_acessivel(s.empresa_id))";
    case "sso_sandbox_runs_admin":
      return "has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid()";
    default:
      return "user_id = auth.uid()";
  }
}
