import { assertEquals, assertStringIncludes } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { aplicarLimitePadrao, avaliarSqlMcp } from './sql-policy.ts';

const permitidosSemAllowAllRows = [
  'SELECT * FROM public.empresas',
  "SELECT current_database(), current_setting('request.jwt.claim.role', true)",
  "SELECT pg_size_pretty(pg_total_relation_size('public.empresas'))",
  'SELECT pg_get_functiondef(p.oid), format_type(p.prorettype, NULL) FROM pg_proc p LIMIT 1',
  "SELECT has_function_privilege('authenticated', 'public.exec_sql(text)', 'EXECUTE')",
  `
    WITH base AS MATERIALIZED (
      SELECT id
      FROM public.empresas
      WHERE slug = 'demo'
    )
    SELECT * FROM base
  `,
  'INSERT INTO public.audit_logs (event_type, metadata) VALUES (\'login\', \'{"k":"v"}\')',
  "UPDATE public.profiles SET role = 'user' WHERE id = 1 AND empresa_id = 2",
  'DELETE FROM public.alertas WHERE id = 1',
  "INSERT INTO public.audit_logs (event_type) SELECT 'ok' WHERE id = 1",
];

const bloqueadosSempre = [
  'SELECT 1; DELETE FROM public.empresas',
  'CREATE INDEX idx_x ON public.empresas (id)',
  "ALTER SYSTEM SET work_mem = '64MB'",
  'DROP VIEW public.v_empresas',
  'TRUNCATE public.audit_logs',
  "COMMENT ON COLUMN public.empresas.nome IS 'x'",
  'COPY public.empresas TO STDOUT',
  "DO $$ BEGIN EXECUTE 'DROP TABLE x'; END $$",
  'CALL public.recalcular_metricas()',
  'SET ROLE postgres',
  'RESET ALL',
  'EXPLAIN DELETE FROM public.empresas WHERE id = 1',
  'PREPARE stmt AS SELECT 1',
  'EXECUTE stmt',
  'DEALLOCATE stmt',
  'LOCK TABLE public.empresas IN SHARE MODE',
  'SELECT * FROM public.empresas FOR SHARE',
  "SELECT public.exec_sql('DROP TABLE x')",
  'SELECT pg_terminate_backend(1)',
  "SELECT nextval('x')",
  `
    WITH escrita AS (
      UPDATE public.empresas SET nome = 'x' WHERE id = 1 RETURNING id
    )
    SELECT * FROM escrita
  `,
];

Deno.test('avaliarSqlMcp permite leituras e DML legítimo sem allow_all_rows', () => {
  for (const sql of permitidosSemAllowAllRows) {
    const avaliacao = avaliarSqlMcp(sql, false, 250);
    assertEquals(avaliacao.motivoBloqueio, null, `não deveria bloquear: ${sql}`);
  }
});

Deno.test('avaliarSqlMcp bloqueia classes perigosas mesmo com allow_all_rows', () => {
  for (const sql of bloqueadosSempre) {
    const avaliacao = avaliarSqlMcp(sql, true, 250);
    assertEquals(typeof avaliacao.motivoBloqueio, 'string', `deveria bloquear: ${sql}`);
  }
});

Deno.test('avaliarSqlMcp só libera UPDATE/DELETE sem escopo com allow_all_rows:true', () => {
  const updateSemWhere = "UPDATE public.profiles SET role = 'admin'";
  const deleteSemWhere = 'DELETE FROM public.audit_logs';

  assertEquals(typeof avaliarSqlMcp(updateSemWhere, false).motivoBloqueio, 'string');
  assertEquals(typeof avaliarSqlMcp(deleteSemWhere, false).motivoBloqueio, 'string');
  assertEquals(avaliarSqlMcp(updateSemWhere, true).motivoBloqueio, null);
  assertEquals(avaliarSqlMcp(deleteSemWhere, true).motivoBloqueio, null);
});

Deno.test('avaliarSqlMcp exige allow_all_rows para INSERT ... SELECT amplo', () => {
  const insertAmplo =
    'INSERT INTO public.audit_logs (event_type) SELECT nome FROM public.empresas WHERE created_at < now()';

  assertEquals(typeof avaliarSqlMcp(insertAmplo, false).motivoBloqueio, 'string');
  assertEquals(avaliarSqlMcp(insertAmplo, true).motivoBloqueio, null);
});

Deno.test('aplicarLimitePadrao sempre aplica cap externo em leituras', () => {
  const semLimite = aplicarLimitePadrao('SELECT * FROM public.empresas', 321);
  const comLimite = aplicarLimitePadrao('SELECT * FROM public.empresas LIMIT 10', 321);
  const limiteInterno = aplicarLimitePadrao(
    'SELECT * FROM (SELECT * FROM public.empresas LIMIT 10) AS base',
    321
  );
  const escrita = aplicarLimitePadrao("UPDATE public.empresas SET nome = 'x' WHERE id = 1", 321);

  assertEquals(
    semLimite,
    'SELECT * FROM (SELECT * FROM public.empresas) AS __mcp_limited LIMIT 321'
  );
  assertStringIncludes(comLimite, 'AS __mcp_limited LIMIT 321');
  assertStringIncludes(limiteInterno, 'AS __mcp_limited LIMIT 321');
  assertEquals(escrita, "UPDATE public.empresas SET nome = 'x' WHERE id = 1");
});
