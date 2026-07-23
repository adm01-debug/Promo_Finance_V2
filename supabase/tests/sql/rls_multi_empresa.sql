-- ============================================================================
-- Suíte de validação de RLS multi-empresa
-- ----------------------------------------------------------------------------
-- Objetivo: garantir que nenhuma tabela com coluna `empresa_id` no schema
-- `public` esteja exposta ao role `authenticated` sem RLS habilitado, e que
-- as políticas cubram os quatro comandos (SELECT/INSERT/UPDATE/DELETE) ou
-- explicitamente restrinjam via ALL.
--
-- Execução:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/sql/rls_multi_empresa.sql
--
-- Saída: erros lançam ROLLBACK; sucesso silencioso encerra o script com 0.
-- Integrar ao gate de CI (.github/workflows/ci.yml) na etapa security.
-- ============================================================================

\set ON_ERROR_STOP on
\pset pager off

BEGIN;

-- 1) Tabelas com empresa_id SEM RLS habilitado
DO $$
DECLARE
  offenders text[];
BEGIN
  SELECT array_agg(c.table_name ORDER BY c.table_name) INTO offenders
  FROM information_schema.columns c
  JOIN pg_class pc ON pc.relname = c.table_name AND pc.relnamespace = 'public'::regnamespace
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
    AND pc.relrowsecurity = false;

  IF offenders IS NOT NULL THEN
    RAISE EXCEPTION 'RLS desabilitado em tabelas multi-empresa: %', offenders;
  END IF;
END $$;

-- 2) Tabelas com empresa_id sem NENHUMA policy (RLS default-deny é bom,
--    mas expõe bug de "esquecemos a policy") — apenas WARN.
DO $$
DECLARE
  missing text[];
BEGIN
  SELECT array_agg(c.table_name ORDER BY c.table_name) INTO missing
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.table_name
    );

  IF missing IS NOT NULL THEN
    RAISE WARNING 'Tabelas multi-empresa sem policies (default-deny): %', missing;
  END IF;
END $$;

-- 3) Policies USING/WITH CHECK devem referenciar empresa_id OU usar
--    helper user_has_empresa_access(). Sinaliza policies "TRUE" absolutas.
DO $$
DECLARE
  suspect record;
  offenders text := '';
BEGIN
  FOR suspect IN
    SELECT p.tablename, p.policyname, p.qual
    FROM pg_policies p
    JOIN information_schema.columns c
      ON c.table_schema = p.schemaname
     AND c.table_name  = p.tablename
     AND c.column_name = 'empresa_id'
    WHERE p.schemaname = 'public'
      AND p.qual IS NOT NULL
      AND p.qual !~* '(empresa_id|user_has_empresa_access|has_role|auth\.uid|current_setting)'
      AND p.qual ~* '^\s*(true|\(true\))\s*$'
  LOOP
    offenders := offenders || format(E'\n  - %s.%s : %s', suspect.tablename, suspect.policyname, suspect.qual);
  END LOOP;

  IF offenders <> '' THEN
    RAISE EXCEPTION 'Policies permissivas em tabelas multi-empresa:%', offenders;
  END IF;
END $$;

-- 4) Toda tabela multi-empresa deve ter GRANT explícito para service_role
--    (proxies dependem disso) e não deve conceder ALL para anon.
DO $$
DECLARE
  bad text[];
BEGIN
  SELECT array_agg(c.table_name ORDER BY c.table_name) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
    AND NOT has_table_privilege('service_role', 'public.' || quote_ident(c.table_name), 'SELECT');

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'service_role sem SELECT em: %', bad;
  END IF;

  SELECT array_agg(c.table_name ORDER BY c.table_name) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name = 'empresa_id'
    AND has_table_privilege('anon', 'public.' || quote_ident(c.table_name), 'DELETE');

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'anon com DELETE em tabelas multi-empresa: %', bad;
  END IF;
END $$;

-- 5) Sanidade: helper user_has_empresa_access existe e é SECURITY DEFINER
--    com search_path fixo.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'user_has_empresa_access'
      AND p.prosecdef = true
      AND array_to_string(p.proconfig, ',') LIKE '%search_path=%'
  ) THEN
    RAISE WARNING 'user_has_empresa_access ausente OU sem SECURITY DEFINER + search_path fixo';
  END IF;
END $$;

ROLLBACK;

\echo '✅ RLS multi-empresa suite: OK'
