import assert from "node:assert/strict";
import { test } from "node:test";

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
  pendingPrMigrations,
  runCanonicalDbGates,
} from "./test-canonical-db-gates.mjs";

test("evaluateRequiredMigrations falha quando uma migration obrigatória some", () => {
  const rows = REQUIRED_MIGRATIONS.slice(0, -1).map((version) => ({ version }));
  assert.throws(() => evaluateRequiredMigrations(rows), /20260826050000/);
});

test("evaluateRequiredMigrations tolera migration introduzida pelo próprio PR", () => {
  // Deadlock original: a migration nova só chega ao canônico depois do merge,
  // então o PR que a adiciona não conseguia passar no próprio gate.
  const novaVersao = "20260912100000";
  const required = [...REQUIRED_MIGRATIONS, novaVersao];
  const rows = REQUIRED_MIGRATIONS.map((version) => ({ version }));

  assert.throws(() => evaluateRequiredMigrations(rows, required), /20260912100000/);

  const resultado = evaluateRequiredMigrations(rows, required, new Set([novaVersao]));
  assert.deepEqual(resultado.pendingFromPr, [novaVersao]);
});

test("evaluateRequiredMigrations ainda falha para migration ausente que o PR não introduziu", () => {
  const required = [...REQUIRED_MIGRATIONS, "20260912100000"];
  const rows = REQUIRED_MIGRATIONS.slice(0, -1).map((version) => ({ version }));

  // O PR introduz a nova, mas 20260826050000 sumiu do canônico: isso é falha real.
  assert.throws(
    () => evaluateRequiredMigrations(rows, required, new Set(["20260912100000"])),
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
    functionGrantRows: EXPECTED_FUNCTION_PRIVILEGES.map((entry) => ({
      function_name: entry.functionName,
      grantee: "service_role",
    })),
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
  assert.equal(summary.migrations.checked, 5);
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
