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
) x;
