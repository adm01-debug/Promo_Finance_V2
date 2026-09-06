#!/usr/bin/env node

import { fileURLToPath } from "node:url";

export const EXPECTED_PROJECT_REF = "bwwbeyolnnzppeuhgkcd";

export const REQUIRED_MIGRATIONS = Object.freeze([
  "20260826010000",
  "20260826020000",
  "20260826030000",
  "20260826040000",
  "20260826050000",
]);

export const EXPECTED_FUNCTION_PRIVILEGES = Object.freeze([
  { functionName: "public.exec_sql(sql text)", expected: freezeMatrix() },
  { functionName: "public.capture_pg_stat_statements_baseline(p_label text)", expected: freezeMatrix() },
  { functionName: "public.capture_slow_queries(threshold_ms numeric)", expected: freezeMatrix() },
  { functionName: "public.monitor_table_bloat()", expected: freezeMatrix() },
  { functionName: "public.snapshot_table_bloat()", expected: freezeMatrix() },
  { functionName: "public.refresh_performance_alerts_weekly()", expected: freezeMatrix() },
  { functionName: "public.sefaz_run_observability_checks()", expected: freezeMatrix() },
  {
    functionName:
      "public.nfe_apply_manifestacao(p_chave text, p_tipo_evento text, p_codigo_evento text, p_sequencial integer, p_data_evento timestamp with time zone, p_protocolo text, p_justificativa text, p_status_retorno text, p_motivo_retorno text, p_novo_status nfe_manifestacao_status, p_raw jsonb)",
    expected: freezeMatrix(),
  },
  {
    functionName: "public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date, p_categoria_id uuid)",
    expected: freezeMatrix(),
  },
  { functionName: "public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid)", expected: freezeMatrix() },
  { functionName: "public.nfe_suggest_contas_pagar(p_nfe_id uuid)", expected: freezeMatrix() },
  { functionName: "public.nfe_unlink_conta_pagar(p_nfe_id uuid)", expected: freezeMatrix() },
  {
    functionName:
      "public.confirmar_conciliacao(p_conciliacao_id uuid, p_user_id uuid, p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)",
    expected: freezeMatrix(),
  },
  {
    functionName:
      "public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)",
    expected: freezeMatrix(),
  },
  {
    functionName: "public.desfazer_conciliacao(p_conciliacao_id uuid, p_transacao_id uuid, p_user_id uuid)",
    expected: freezeMatrix(),
  },
  { functionName: "public.desfazer_conciliacao_manual(p_transacao_id uuid)", expected: freezeMatrix() },
  {
    functionName:
      "public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid)",
    expected: freezeMatrix(),
  },
]);

export const EXPECTED_FIXED_POLICIES = Object.freeze([
  {
    tableName: "kpis_operacionais",
    policyName: "kpis_operacionais_owner",
    cmd: "ALL",
    rolesCsv: "authenticated",
    qualMustInclude: ["user_id = auth.uid()"],
    withCheckMustInclude: ["user_id = auth.uid()"],
  },
  {
    tableName: "scim_setup_checklist",
    policyName: "scim_checklist_own",
    cmd: "ALL",
    rolesCsv: "authenticated",
    qualMustInclude: ["user_id = auth.uid()"],
    withCheckMustInclude: ["user_id = auth.uid()"],
  },
  {
    tableName: "simulacao_tributos_detalhados",
    policyName: "sim_trib_acesso",
    cmd: "ALL",
    rolesCsv: "authenticated",
    qualMustInclude: ["simulacoes", "empresa_acessivel", "simulacao_id"],
    withCheckMustInclude: ["simulacoes", "empresa_acessivel", "simulacao_id"],
  },
  {
    tableName: "sso_sandbox_runs",
    policyName: "sso_sandbox_runs_admin",
    cmd: "ALL",
    rolesCsv: "authenticated",
    qualMustInclude: ["has_role(auth.uid(),'admin'::app_role)"],
    withCheckMustInclude: ["has_role(auth.uid(),'admin'::app_role)", "created_by = auth.uid()"],
  },
]);

export const ALLOWED_LITERAL_TRUE_POLICIES = Object.freeze([
  allowPolicy("allowed_countries", "Public read", "SELECT", "authenticated"),
  allowPolicy("aliquotas_interestaduais", "aliq_inter_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("aliquotas_internas_uf", "aliq_internas_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("aliquotas_iss_municipal", "aliq_iss_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("benchmarks_setoriais", "benchmarks_select", "SELECT", "authenticated"),
  allowPolicy("audit_logs", "System can insert audit logs", "INSERT", "authenticated"),
  allowPolicy("beneficios_fiscais", "beneficios_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("bitrix_oauth_tokens", "bitrix_oauth_tokens_service_role_only", "ALL", "service_role"),
  allowPolicy("bling_tokens", "bling_tokens_service_role_only", "ALL", "service_role"),
  allowPolicy("ci_security_gate_events", "Service role manages CI security gate events", "ALL", "service_role"),
  allowPolicy("cnaes", "cnaes_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("cnpja_cache", "cnpja_cache_service_role_only", "ALL", "service_role"),
  allowPolicy("estrategias_elisao", "estrategias_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("faixas_simples_nacional", "faixas_simples_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("frontend_error_logs", "frontend_error_anon_insert", "INSERT", "anon"),
  allowPolicy("integrity_alerts", "integrity_alerts_service_all", "ALL", "service_role"),
  allowPolicy("itens_lista_iss", "itens_iss_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("ncms", "ncms_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("protocolos_st", "protocolos_st_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("protocolos_st_ncms", "protocolos_st_ncms_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("protocolos_st_ufs", "protocolos_st_ufs_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("ufs", "ufs_select_authenticated", "SELECT", "authenticated"),
  allowPolicy("elisao_regras_creditos", "regras_creditos_leitura", "SELECT", "authenticated"),
]);

export const ALLOWED_ANON_WRITE_GRANTS = Object.freeze([
  Object.freeze({ tableName: "frontend_error_logs", grantee: "anon", privilegeType: "INSERT" }),
]);

const READ_ONLY_ENDPOINT = "https://api.supabase.com/v1/projects";

function freezeMatrix() {
  return Object.freeze({
    anon: false,
    authenticated: false,
    service_role: true,
    PUBLIC: false,
  });
}

function allowPolicy(tableName, policyName, cmd, rolesCsv) {
  return Object.freeze({ tableName, policyName, cmd, rolesCsv });
}

export function readEnv(env = process.env) {
  const accessToken = env.SUPABASE_ACCESS_TOKEN;
  const projectRef = env.SUPABASE_PROJECT_REF;

  if (!accessToken) {
    throw new Error("SUPABASE_ACCESS_TOKEN ausente.");
  }

  if (!projectRef) {
    throw new Error("SUPABASE_PROJECT_REF ausente.");
  }

  if (projectRef !== EXPECTED_PROJECT_REF) {
    throw new Error(
      `Projeto incorreto para o gate canônico: esperado ${EXPECTED_PROJECT_REF}, recebido ${projectRef}.`,
    );
  }

  return { accessToken, projectRef };
}

export function normalizeExpression(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/"/g, "")
    .replace(/\s+/g, "");
}

export function normalizeRolesCsv(value) {
  return String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

export function evaluateRequiredMigrations(rows, required = REQUIRED_MIGRATIONS) {
  const present = new Set(rows.map((row) => String(row.version)));
  const missing = required.filter((version) => !present.has(version));
  if (missing.length > 0) {
    throw new Error(`Migrations obrigatórias ausentes no canônico: ${missing.join(", ")}.`);
  }
  return { checked: required.length };
}

export function evaluateFunctionPrivileges(functionRows, grantRows, expected = EXPECTED_FUNCTION_PRIVILEGES) {
  const existingFunctions = new Set(functionRows.map((row) => String(row.function_name)));
  const missingFunctions = expected
    .map((entry) => entry.functionName)
    .filter((functionName) => !existingFunctions.has(functionName));

  if (missingFunctions.length > 0) {
    throw new Error(`Funções sensíveis ausentes no canônico: ${missingFunctions.join(", ")}.`);
  }

  const actualByFunction = new Map();
  for (const entry of expected) {
    actualByFunction.set(entry.functionName, {
      anon: false,
      authenticated: false,
      service_role: false,
      PUBLIC: false,
    });
  }

  for (const row of grantRows) {
    const functionName = String(row.function_name);
    const grantee = String(row.grantee);
    if (!actualByFunction.has(functionName)) {
      continue;
    }
    if (grantee in actualByFunction.get(functionName)) {
      actualByFunction.get(functionName)[grantee] = true;
    }
  }

  const failures = [];
  for (const entry of expected) {
    const actual = actualByFunction.get(entry.functionName);
    for (const [role, expectedValue] of Object.entries(entry.expected)) {
      if (actual[role] !== expectedValue) {
        failures.push(`${entry.functionName} -> ${role}=${actual[role]} (esperado ${expectedValue})`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`ACL divergente em funções sensíveis: ${failures.join("; ")}.`);
  }

  return { checked: expected.length };
}

export function evaluateFixedPolicies(rows, expected = EXPECTED_FIXED_POLICIES) {
  const byKey = new Map(rows.map((row) => [fixedPolicyKey(row), row]));
  const failures = [];

  for (const entry of expected) {
    const key = fixedPolicyKey(entry);
    const actual = byKey.get(key);

    if (!actual) {
      failures.push(`${entry.tableName}.${entry.policyName} ausente`);
      continue;
    }

    const actualRoles = normalizeRolesCsv(actual.roles_csv);
    if (actualRoles !== normalizeRolesCsv(entry.rolesCsv)) {
      failures.push(`${entry.tableName}.${entry.policyName} roles=${actualRoles} (esperado ${entry.rolesCsv})`);
    }

    const actualQual = normalizeExpression(actual.qual);
    const actualWithCheck = normalizeExpression(actual.with_check);

    for (const fragment of entry.qualMustInclude) {
      if (!actualQual.includes(normalizeExpression(fragment))) {
        failures.push(`${entry.tableName}.${entry.policyName} qual sem "${fragment}"`);
      }
    }

    for (const fragment of entry.withCheckMustInclude) {
      if (!actualWithCheck.includes(normalizeExpression(fragment))) {
        failures.push(`${entry.tableName}.${entry.policyName} with_check sem "${fragment}"`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`Policies corrigidas divergentes: ${failures.join("; ")}.`);
  }

  return { checked: expected.length };
}

export function evaluateLiteralTruePolicies(rows, allowlist = ALLOWED_LITERAL_TRUE_POLICIES) {
  const expectedKeys = new Set(allowlist.map(policyKey));
  const actualKeys = new Set(rows.map(policyKey));
  const unexpected = rows.filter((row) => !expectedKeys.has(policyKey(row)));
  const missing = allowlist.filter((row) => !actualKeys.has(policyKey(row)));

  if (unexpected.length > 0 || missing.length > 0) {
    const parts = [];
    if (unexpected.length > 0) {
      parts.push(
        `extras: ${unexpected.map((row) => `${row.tableName ?? row.tablename}.${row.policyName ?? row.policyname}`).join(", ")}`,
      );
    }
    if (missing.length > 0) {
      parts.push(`ausentes: ${missing.map((row) => `${row.tableName}.${row.policyName}`).join(", ")}`);
    }
    throw new Error(`Policies literal-true fora do baseline: ${parts.join(" | ")}.`);
  }

  return { checked: allowlist.length };
}

export function evaluatePerformanceAlertConstraint(rows) {
  if (rows.length !== 1) {
    throw new Error(`Constraint performance_alerts_source_check esperada em 1 linha, recebidas ${rows.length}.`);
  }

  const normalized = normalizeExpression(rows[0].definition);
  for (const token of ["query_telemetry", "pg_stat_statements", "cron"]) {
    if (!normalized.includes(normalizeExpression(token))) {
      throw new Error(`Constraint performance_alerts_source_check sem o valor obrigatório "${token}".`);
    }
  }

  return { checked: 1 };
}

export function evaluateAnonWriteGrants(rows, allowlist = ALLOWED_ANON_WRITE_GRANTS) {
  const expectedKeys = new Set(allowlist.map(grantKey));
  const actualKeys = new Set(rows.map(grantKey));
  const unexpected = rows.filter((row) => !expectedKeys.has(grantKey(row)));
  const missing = allowlist.filter((row) => !actualKeys.has(grantKey(row)));

  if (unexpected.length > 0 || missing.length > 0) {
    const parts = [];
    if (unexpected.length > 0) {
      parts.push(
        `extras: ${unexpected.map((row) => `${row.tableName ?? row.tablename}:${row.privilegeType ?? row.privilege_type}:${row.grantee}`).join(", ")}`,
      );
    }
    if (missing.length > 0) {
      parts.push(`ausentes: ${missing.map((row) => `${row.tableName}:${row.privilegeType}:${row.grantee}`).join(", ")}`);
    }
    throw new Error(`Grants de escrita anônima fora do baseline: ${parts.join(" | ")}.`);
  }

  return { checked: allowlist.length };
}

export async function runCanonicalDbGates({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch indisponível para consultar a Management API do Supabase.");
  }

  const { accessToken, projectRef } = readEnv(env);

  const migrationRows = await queryReadOnlyCatalog({
    fetchImpl,
    accessToken,
    projectRef,
    queryName: "migrations",
    sql: `
      SELECT version
      FROM supabase_migrations.schema_migrations
      WHERE version IN (${sqlStringList(REQUIRED_MIGRATIONS)})
      ORDER BY version;
    `,
  });

  const functionRows = await queryReadOnlyCatalog({
    fetchImpl,
    accessToken,
    projectRef,
    queryName: "function-existence",
    sql: `
      SELECT pg_catalog.format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)) AS function_name
      FROM pg_catalog.pg_proc AS p
      JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND pg_catalog.format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))
            IN (${sqlStringList(EXPECTED_FUNCTION_PRIVILEGES.map((entry) => entry.functionName))})
      ORDER BY function_name;
    `,
  });

  const functionGrantRows = await queryReadOnlyCatalog({
    fetchImpl,
    accessToken,
    projectRef,
    queryName: "function-grants",
    sql: `
      SELECT
        pg_catalog.format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)) AS function_name,
        CASE
          WHEN acl.grantee = 0 THEN 'PUBLIC'
          ELSE pg_catalog.pg_get_userbyid(acl.grantee)
        END AS grantee
      FROM pg_catalog.pg_proc AS p
      JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) AS acl
      WHERE n.nspname = 'public'
        AND acl.privilege_type = 'EXECUTE'
        AND (
          acl.grantee = 0
          OR pg_catalog.pg_get_userbyid(acl.grantee) IN ('anon', 'authenticated', 'service_role')
        )
        AND pg_catalog.format('%I.%I(%s)', n.nspname, p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid))
            IN (${sqlStringList(EXPECTED_FUNCTION_PRIVILEGES.map((entry) => entry.functionName))})
      ORDER BY function_name, grantee;
    `,
  });

  const fixedPolicyRows = await queryReadOnlyCatalog({
    fetchImpl,
    accessToken,
    projectRef,
    queryName: "fixed-policies",
    sql: `
      SELECT
        tablename,
        policyname,
        cmd,
        pg_catalog.array_to_string(roles, ',') AS roles_csv,
        qual,
        with_check
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND (${EXPECTED_FIXED_POLICIES.map(
          (entry) =>
            `(tablename = ${sqlString(entry.tableName)} AND policyname = ${sqlString(entry.policyName)} AND cmd = ${sqlString(entry.cmd)})`,
        ).join(" OR ")})
      ORDER BY tablename, policyname;
    `,
  });

  const literalTruePolicyRows = await queryReadOnlyCatalog({
    fetchImpl,
    accessToken,
    projectRef,
    queryName: "literal-true-policies",
    sql: `
      SELECT
        tablename,
        policyname,
        cmd,
        pg_catalog.array_to_string(roles, ',') AS roles_csv
      FROM pg_catalog.pg_policies
      WHERE schemaname = 'public'
        AND (
          pg_catalog.btrim(COALESCE(qual, '')) IN ('true', '(true)')
          OR pg_catalog.btrim(COALESCE(with_check, '')) IN ('true', '(true)')
        )
      ORDER BY tablename, policyname, cmd;
    `,
  });

  const constraintRows = await queryReadOnlyCatalog({
    fetchImpl,
    accessToken,
    projectRef,
    queryName: "performance-alerts-constraint",
    sql: `
      SELECT
        c.conname AS constraint_name,
        pg_catalog.pg_get_constraintdef(c.oid, true) AS definition
      FROM pg_catalog.pg_constraint AS c
      JOIN pg_catalog.pg_class AS t ON t.oid = c.conrelid
      JOIN pg_catalog.pg_namespace AS n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'performance_alerts'
        AND c.conname = 'performance_alerts_source_check';
    `,
  });

  const anonWriteGrantRows = await queryReadOnlyCatalog({
    fetchImpl,
    accessToken,
    projectRef,
    queryName: "anon-write-grants",
    sql: `
      SELECT
        c.relname AS tablename,
        CASE
          WHEN acl.grantee = 0 THEN 'PUBLIC'
          ELSE pg_catalog.pg_get_userbyid(acl.grantee)
        END AS grantee,
        acl.privilege_type
      FROM pg_catalog.pg_class AS c
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
      CROSS JOIN LATERAL pg_catalog.aclexplode(COALESCE(c.relacl, pg_catalog.acldefault('r', c.relowner))) AS acl
      WHERE n.nspname = 'public'
        AND c.relkind IN ('r', 'p')
        AND acl.privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
        AND (
          acl.grantee = 0
          OR pg_catalog.pg_get_userbyid(acl.grantee) = 'anon'
        )
      ORDER BY tablename, grantee, privilege_type;
    `,
  });

  const summary = {
    projectRef,
    migrations: evaluateRequiredMigrations(migrationRows),
    functions: evaluateFunctionPrivileges(functionRows, functionGrantRows),
    fixedPolicies: evaluateFixedPolicies(fixedPolicyRows),
    literalTruePolicies: evaluateLiteralTruePolicies(
      literalTruePolicyRows.map((row) => ({
        tableName: row.tablename,
        policyName: row.policyname,
        cmd: row.cmd,
        rolesCsv: row.roles_csv,
      })),
    ),
    performanceAlertsConstraint: evaluatePerformanceAlertConstraint(constraintRows),
    anonWriteGrants: evaluateAnonWriteGrants(
      anonWriteGrantRows.map((row) => ({
        tableName: row.tablename,
        grantee: row.grantee,
        privilegeType: row.privilege_type,
      })),
    ),
  };

  return summary;
}

export async function queryReadOnlyCatalog({ fetchImpl, accessToken, projectRef, queryName, sql }) {
  const response = await fetchImpl(`${READ_ONLY_ENDPOINT}/${projectRef}/database/query/read-only`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const rawBody = await response.text();
  let parsed;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error(`Management API (${queryName}) respondeu JSON inválido com HTTP ${response.status}.`);
  }

  if (![200, 201].includes(response.status)) {
    const detail =
      parsed && typeof parsed === "object" && "message" in parsed && typeof parsed.message === "string"
        ? parsed.message
        : "sem detalhe";
    throw new Error(`Management API (${queryName}) falhou com HTTP ${response.status}: ${detail}.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Management API (${queryName}) retornou formato inesperado; esperava array de linhas.`);
  }

  return parsed;
}

function policyKey(row) {
  const tableName = String(row.tableName ?? row.tablename);
  const policyName = String(row.policyName ?? row.policyname);
  const cmd = String(row.cmd);
  const rolesCsv = normalizeRolesCsv(row.rolesCsv ?? row.roles_csv);
  return `${tableName}|${policyName}|${cmd}|${rolesCsv}`;
}

function grantKey(row) {
  const tableName = String(row.tableName ?? row.tablename);
  const grantee = String(row.grantee);
  const privilegeType = String(row.privilegeType ?? row.privilege_type);
  return `${tableName}|${grantee}|${privilegeType}`;
}

function fixedPolicyKey(row) {
  const tableName = String(row.tableName ?? row.tablename);
  const policyName = String(row.policyName ?? row.policyname);
  return `${tableName}|${policyName}`;
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlStringList(values) {
  return values.map(sqlString).join(", ");
}

async function main() {
  const summary = await runCanonicalDbGates();
  console.log(
    [
      "✅ Gate canônico validado.",
      `Projeto: ${summary.projectRef}`,
      `Migrations: ${summary.migrations.checked}`,
      `Funções sensíveis: ${summary.functions.checked}`,
      `Policies corrigidas: ${summary.fixedPolicies.checked}`,
      `Policies literal-true allowlisted: ${summary.literalTruePolicies.checked}`,
      `Grants anon allowlisted: ${summary.anonWriteGrants.checked}`,
    ].join(" "),
  );
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  main().catch((error) => {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
