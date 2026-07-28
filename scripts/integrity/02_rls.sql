-- 02_rls.sql — Cobertura de RLS e default-deny em toda tabela public.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH
allowed AS (
  SELECT jsonb_array_elements_text((:'allow_public')::jsonb) AS tbl
),
public_tables AS (
  SELECT c.relname, c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
),
rls_off AS (
  SELECT string_agg(relname, ',') AS list
  FROM public_tables WHERE relrowsecurity = false
),
-- Policies com predicado literal 'true' fora da whitelist
overpermissive AS (
  SELECT string_agg(distinct tablename || ':' || policyname, ',') AS list
  FROM pg_policies p
  WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true')
    AND ('anon' = ANY(roles) OR 'authenticated' = ANY(roles) OR 'public' = ANY(roles))
    AND tablename NOT IN (SELECT tbl FROM allowed)
),
-- Tabelas escopadas por usuário devem referenciar auth.uid()/has_role/has_any_role
user_scoped_missing_auth AS (
  SELECT string_agg(t.relname, ',') AS list
  FROM public_tables t
  WHERE t.relname NOT IN (SELECT tbl FROM allowed)
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename = t.relname
        AND (
          COALESCE(p.qual,'')        ~* '(auth\.uid|has_role|has_any_role)'
          OR COALESCE(p.with_check,'') ~* '(auth\.uid|has_role|has_any_role)'
        )
    )
),
-- Views voltadas ao cliente com security_invoker=false
views_no_invoker AS (
  SELECT string_agg(c.relname, ',') AS list
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND NOT COALESCE(
      (SELECT (reloptions::text) LIKE '%security_invoker=true%'), false
    )
),
-- Gate #25 — tabelas de identidade/provisionamento onde o escopo global é intencional
tenant_exempt AS (
  SELECT unnest(ARRAY[
    'profiles','user_empresas','user_roles','sso_providers','sso_role_mappings',
    'sso_sandbox_runs','sso_user_groups','scim_tokens','scim_operations_log',
    'empresas','relatorios_agendados','historico_relatorios'
  ]) AS tbl
),
-- Gate #25a — policies com has_role em tabelas que possuem empresa_id, sem escopo de tenant
tenant_direct_missing AS (
  SELECT string_agg(DISTINCT p.tablename || ':' || p.policyname, ',') AS list
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename NOT IN (SELECT tbl FROM tenant_exempt)
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = p.tablename
        AND c.column_name = 'empresa_id'
    )
    AND (COALESCE(p.qual,'') || COALESCE(p.with_check,'')) LIKE '%has_role%'
    AND (COALESCE(p.qual,'') || COALESCE(p.with_check,'')) NOT LIKE '%empresa%'
),
-- Gate #25b — policies com has_role em tabelas ligadas a empresa por FK (sem coluna própria)
tenant_indirect_missing AS (
  SELECT string_agg(DISTINCT p.tablename || ':' || p.policyname, ',') AS list
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename NOT IN (SELECT tbl FROM tenant_exempt)
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = p.tablename
        AND c.column_name = 'empresa_id'
    )
    AND EXISTS (
      SELECT 1
      FROM pg_constraint fk
      JOIN information_schema.columns pc
        ON pc.table_schema = 'public'
       AND pc.table_name = fk.confrelid::regclass::text
       AND pc.column_name = 'empresa_id'
      WHERE fk.contype = 'f'
        AND fk.connamespace = 'public'::regnamespace
        AND fk.conrelid::regclass::text = p.tablename
    )
    AND (COALESCE(p.qual,'') || COALESCE(p.with_check,'')) LIKE '%has_role%'
    AND (COALESCE(p.qual,'') || COALESCE(p.with_check,'')) NOT LIKE '%empresa%'
)
SELECT * FROM (
  SELECT 'rls.all_tables_have_rls',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         '0', COALESCE(list,'-'), 'tabelas sem RLS: ' || COALESCE(list,'')
    FROM rls_off
  UNION ALL
  SELECT 'rls.no_overpermissive_true',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         '0', COALESCE(list,'-'), 'policies USING/WITH CHECK = true: ' || COALESCE(list,'')
    FROM overpermissive
  UNION ALL
  SELECT 'rls.user_scoped_reference_auth',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         '0', COALESCE(list,'-'), 'tabelas sem policy auth.uid/has_role: ' || COALESCE(list,'')
    FROM user_scoped_missing_auth
  UNION ALL
  SELECT 'rls.views_security_invoker',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         '0', COALESCE(list,'-'), 'views sem security_invoker=true: ' || COALESCE(list,'')
    FROM views_no_invoker
  UNION ALL
  SELECT 'rls.gate25_tenant_scope_direct',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         '0', COALESCE(list,'-'), 'policies role-only em tabelas com empresa_id: ' || COALESCE(list,'')
    FROM tenant_direct_missing
  UNION ALL
  SELECT 'rls.gate25_tenant_scope_indirect',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         '0', COALESCE(list,'-'), 'policies role-only em tabelas ligadas a empresa por FK: ' || COALESCE(list,'')
    FROM tenant_indirect_missing
) x;

