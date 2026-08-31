import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import {
  analisarSqlMcp,
  removerComentariosELiterais,
  validarEscritaEscopada,
} from "./sql-write-guard.ts";

const leiturasPermitidas = [
  "SELECT * FROM public.empresas",
  "SELECT '; DROP TABLE users' AS texto",
  `
    WITH base AS MATERIALIZED (
      SELECT id, nome
      FROM public.empresas
      WHERE slug = 'demo;--'
    )
    SELECT * FROM base
  `,
  `
    WITH RECURSIVE arvore AS NOT MATERIALIZED (
      SELECT id, parent_id
      FROM public.categorias
      WHERE parent_id IS NULL
    )
    SELECT * FROM arvore
  `,
];

const escritasPermitidas = [
  "INSERT INTO public.audit_logs (event_type, metadata) VALUES ('login', '{\"raw\":\"x;drop\"}')",
  "UPDATE public.contas_pagar SET status = 'pago' WHERE id = 42 AND empresa_id = 7",
  "DELETE FROM public.alertas WHERE user_id = 42 AND created_at < now() - interval '90 days'",
  "UPDATE public.push_subscriptions SET ativo = false WHERE id = 99",
];

const bloqueiosSempre = [
  "SELECT * FROM public.empresas; DELETE FROM public.empresas",
  "CREATE TABLE public.tmp(id int)",
  "ALTER TABLE public.empresas ADD COLUMN teste text",
  "DROP TABLE public.empresas",
  "TRUNCATE TABLE public.empresas",
  "GRANT SELECT ON public.empresas TO anon",
  "REVOKE ALL ON public.empresas FROM anon",
  "COMMENT ON TABLE public.empresas IS 'x'",
  "COPY public.empresas TO STDOUT",
  "DO $$ BEGIN PERFORM 1; END $$",
  "CALL public.rebuild_cache()",
  "SET search_path TO public",
  "RESET ALL",
  "SHOW search_path",
  "BEGIN",
  "COMMIT",
  "LOCK TABLE public.empresas IN ACCESS EXCLUSIVE MODE",
  "MERGE INTO public.empresas e USING public.empresas x ON e.id = x.id WHEN MATCHED THEN UPDATE SET nome = x.nome",
  "SELECT * FROM public.empresas FOR UPDATE",
  "SELECT public.exec_sql('DROP TABLE public.empresas')",
  "SELECT private.exec_sql('DROP TABLE public.empresas')",
  "SELECT set_config('search_path', 'public', false)",
  "SELECT pg_terminate_backend(123)",
  "SELECT pg_cancel_backend(123)",
  "SELECT pg_reload_conf()",
  "SELECT dblink_exec('dbname=postgres', 'DROP TABLE x')",
  "SELECT lo_import('/tmp/x')",
  "SELECT lo_export(1, '/tmp/x')",
  "SELECT nextval('public.seq_teste')",
  "SELECT setval('public.seq_teste', 9)",
  "SELECT pg_advisory_lock(1)",
  "SELECT pg_try_advisory_lock(1)",
  "SELECT pg_advisory_unlock_all()",
  "SELECT pg_notify('canal', 'evento')",
  "SELECT pg_read_file('/etc/passwd')",
  "SELECT pg_read_binary_file('/etc/passwd')",
  "SELECT pg_ls_dir('.')",
  "SELECT pg_stat_file('/etc/passwd')",
  "SELECT pg_log_backend_memory_contexts(1)",
  "SELECT pg_rotate_logfile()",
  "SELECT lo_get(1)",
  "SELECT id INTO public.tmp_ids FROM public.empresas",
  'SELECT "Nome" FROM public.empresas',
  `
    WITH purge AS (
      DELETE FROM public.audit_logs RETURNING id
    )
    SELECT * FROM purge
  `,
  `
    WITH base AS (
      SELECT set_config('search_path', 'public', false) AS noop
    )
    SELECT * FROM base
  `,
  "DELETE FROM public.empresas WHERE id = 1 /* comentário não terminado",
];

const bloqueiosEscopo = [
  "DELETE FROM public.audit_logs",
  "DELETE FROM public.audit_logs WHERE true",
  "DELETE FROM public.audit_logs WHERE 1=1",
  "DELETE FROM public.audit_logs WHERE 2 > 1",
  "DELETE FROM public.audit_logs WHERE id = id",
  "DELETE FROM public.audit_logs WHERE id = id OR 1 = 0",
  "DELETE FROM public.audit_logs WHERE id IS NOT NULL",
  "DELETE FROM public.audit_logs WHERE id = id AND empresa_id = empresa_id",
  "DELETE FROM public.audit_logs WHERE id = 7 OR empresa_id = 9",
  "UPDATE public.profiles SET role = 'admin' WHERE NOT false",
  "UPDATE public.profiles SET role = 'admin' WHERE id = id OR 1 = 1",
  "DELETE FROM public.audit_logs WHERE NULL IS NULL",
  "DELETE FROM public.audit_logs WHERE now() = now()",
  "DELETE FROM public.audit_logs WHERE id IN (SELECT id FROM public.empresas)",
];

Deno.test("analisarSqlMcp permite leituras SELECT/WITH somente leitura", () => {
  for (const sql of leiturasPermitidas) {
    const analise = analisarSqlMcp(sql);
    assertEquals(analise.motivoBloqueio, null, `não deveria bloquear: ${sql}`);
    assertEquals(
      analise.somenteLeitura,
      true,
      `deveria marcar como leitura: ${sql}`,
    );
  }
});

Deno.test("validarEscritaEscopada permite INSERT/UPDATE/DELETE legítimos executáveis", () => {
  for (const sql of escritasPermitidas) {
    assertEquals(
      validarEscritaEscopada(sql),
      null,
      `não deveria bloquear: ${sql}`,
    );
  }
});

Deno.test("analisarSqlMcp bloqueia comandos perigosos, funções laterais e quoted identifiers", () => {
  for (const sql of bloqueiosSempre) {
    const analise = analisarSqlMcp(sql);
    assertEquals(
      typeof analise.motivoBloqueio,
      "string",
      `deveria bloquear: ${sql}`,
    );
  }
});

Deno.test("validarEscritaEscopada exige escopo verificável em UPDATE/DELETE", () => {
  for (const sql of bloqueiosEscopo) {
    const motivo = validarEscritaEscopada(sql);
    assertEquals(
      typeof motivo,
      "string",
      `deveria bloquear por escopo: ${sql}`,
    );
  }
});

Deno.test("removerComentariosELiterais neutraliza comentários, strings e dollar-quoted", () => {
  const { sql, invalido } = removerComentariosELiterais(`
    SELECT ';DROP TABLE x' AS texto, $$GRANT ALL$$ AS corpo
    FROM public.empresas
    -- DELETE FROM public.empresas
    WHERE slug = 'demo'
  `);

  assertEquals(invalido, false);
  assertEquals(sql.includes("DROP TABLE"), false);
  assertEquals(sql.includes("DELETE FROM public.empresas"), false);
  assertEquals(sql.includes("GRANT ALL"), false);
});
