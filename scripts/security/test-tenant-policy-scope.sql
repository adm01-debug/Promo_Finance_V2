-- test-tenant-policy-scope.sql — Gate #25
--
-- Bloqueia o merge quando uma tabela multi-inquilino (vínculo direto por
-- coluna `empresa_id` ou indireto por FK para tabela com `empresa_id`) volta a
-- ser protegida por uma policy GLOBAL, isto é, sem escopo de empresa:
--
--   #25a  policy baseada apenas em papel (`has_role`) sem `empresa_acessivel`/
--         `empresa_membro_ativo` — o admin de uma empresa alcança as demais.
--   #25b  policy irrestrita (`USING (true)`, `WITH CHECK (true)` ou ausência de
--         predicado) concedida a anon/authenticated/PUBLIC.
--
-- Tabelas de identidade, provisionamento e catálogo global são isentas: o
-- escopo transversal ali é intencional.
--
-- Uso: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/security/test-tenant-policy-scope.sql

\set ON_ERROR_STOP on
\pset pager off

-- Isenções compartilhadas pelos dois blocos.
CREATE TEMP VIEW gate25_exempt AS
SELECT unnest(ARRAY[
  'profiles','user_empresas','user_roles','sso_providers','sso_role_mappings',
  'sso_sandbox_runs','sso_user_groups','scim_tokens','scim_operations_log',
  'empresas','relatorios_agendados','historico_relatorios'
]) AS tbl;

-- Tabelas com vínculo de tenant (direto ou por FK).
CREATE TEMP VIEW gate25_tabelas_tenant AS
SELECT
  t.table_name::text AS tabela,
  EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'empresa_id'
  ) AS tem_coluna,
  EXISTS (
    SELECT 1
    FROM pg_constraint fk
    JOIN information_schema.columns pc
      ON pc.table_schema = 'public'
     AND pc.table_name = fk.confrelid::regclass::text
     AND pc.column_name = 'empresa_id'
    WHERE fk.contype = 'f'
      AND fk.connamespace = 'public'::regnamespace
      AND fk.conrelid::regclass::text = t.table_name
  ) AS tem_fk
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT IN (SELECT tbl FROM gate25_exempt);

-- ---------------------------------------------------------------------------
-- Gate #25a — policy só com papel (has_role) em tabela multi-inquilino
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_violacoes text;
  v_total int;
BEGIN
  SELECT count(*),
         string_agg(
           format('  - %s.%s (%s, vínculo %s)',
                  x.tabela, x.policyname, x.cmd,
                  CASE WHEN x.tem_coluna THEN 'direto' ELSE 'fk' END),
           E'\n' ORDER BY x.tabela, x.policyname)
    INTO v_total, v_violacoes
  FROM (
    SELECT p.tablename::text AS tabela, p.policyname::text, p.cmd::text,
           tt.tem_coluna
    FROM pg_policies p
    JOIN gate25_tabelas_tenant tt ON tt.tabela = p.tablename
    WHERE p.schemaname = 'public'
      AND (tt.tem_coluna OR tt.tem_fk)
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) LIKE '%has_role%'
      AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) NOT LIKE '%empresa%'
  ) x;

  IF v_total > 0 THEN
    RAISE EXCEPTION E'Gate #25a falhou: % policy(ies) só com papel em tabela multi-inquilino:\n%',
      v_total, v_violacoes;
  END IF;

  RAISE NOTICE 'Gate #25a OK — nenhuma policy multi-inquilino baseada só em papel.';
END $$;

-- ---------------------------------------------------------------------------
-- Gate #25b — policy irrestrita (true / sem predicado) exposta a anon/authenticated
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_violacoes text;
  v_total int;
BEGIN
  SELECT count(*),
         string_agg(
           format('  - %s.%s (%s, roles=%s)',
                  x.tabela, x.policyname, x.cmd, x.roles),
           E'\n' ORDER BY x.tabela, x.policyname)
    INTO v_total, v_violacoes
  FROM (
    SELECT p.tablename::text AS tabela,
           p.policyname::text,
           p.cmd::text,
           array_to_string(p.roles, ',') AS roles
    FROM pg_policies p
    JOIN gate25_tabelas_tenant tt ON tt.tabela = p.tablename
    WHERE p.schemaname = 'public'
      AND (tt.tem_coluna OR tt.tem_fk)
      -- Alcança papéis de aplicação (service_role legitimamente ignora RLS).
      AND (p.roles && ARRAY['anon','authenticated','public']::name[])
      -- Sem qualquer predicado de escopo: USING(true)/WITH CHECK(true)/ausente.
      AND coalesce(btrim(p.qual), 'true') = 'true'
      AND (
        p.cmd = 'SELECT'
        OR coalesce(btrim(p.with_check), 'true') = 'true'
      )
  ) x;

  IF v_total > 0 THEN
    RAISE EXCEPTION E'Gate #25b falhou: % policy(ies) irrestritas em tabela multi-inquilino:\n%',
      v_total, v_violacoes;
  END IF;

  RAISE NOTICE 'Gate #25b OK — nenhuma policy irrestrita em tabela multi-inquilino.';
END $$;

-- ---------------------------------------------------------------------------
-- Gate #25c — função canônica no banco (mantém CI e runtime alinhados)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_total int;
  v_violacoes text;
BEGIN
  IF to_regprocedure('public.gate_25_policies_sem_tenant()') IS NULL THEN
    RAISE NOTICE 'Gate #25c ignorado — função gate_25_policies_sem_tenant() ausente.';
    RETURN;
  END IF;

  SELECT count(*),
         string_agg(format('  - %s.%s (%s, vínculo %s)', g.tabela, g.policy_name, g.cmd, g.vinculo),
                    E'\n' ORDER BY g.tabela, g.policy_name)
    INTO v_total, v_violacoes
  FROM public.gate_25_policies_sem_tenant() g;

  IF v_total > 0 THEN
    RAISE EXCEPTION E'Gate #25c falhou: % policy(ies) reportadas pela função canônica:\n%',
      v_total, v_violacoes;
  END IF;

  RAISE NOTICE 'Gate #25c OK — função canônica sem violações.';
END $$;

\echo '✅ Gate #25 aprovado — isolamento por empresa preservado em todas as policies.'
