-- 03_grants.sql — Matriz role × privilege por tabela em public.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH
allowed AS (
  SELECT jsonb_array_elements_text((:'allow_public')::jsonb) AS tbl
),
-- anon deve ter apenas SELECT e apenas em tabelas whitelisted
anon_bad AS (
  SELECT string_agg(distinct table_name || ':' || privilege_type, ',') AS list
  FROM information_schema.role_table_grants g
  WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND (
      privilege_type <> 'SELECT'
      OR table_name NOT IN (SELECT tbl FROM allowed)
    )
),
-- service_role deve ter ALL (SELECT/INSERT/UPDATE/DELETE) em toda tabela public
service_missing AS (
  SELECT string_agg(distinct c.relname, ',') AS list
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND (
      SELECT count(distinct privilege_type)
      FROM information_schema.role_table_grants
      WHERE table_schema='public' AND table_name=c.relname AND grantee='service_role'
        AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')
    ) < 4
),
-- authenticated deve ter pelo menos SELECT em toda tabela com policy 'authenticated'
authenticated_missing AS (
  SELECT string_agg(distinct p.tablename, ',') AS list
  FROM pg_policies p
  WHERE p.schemaname='public'
    AND 'authenticated' = ANY(p.roles)
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants g
      WHERE g.table_schema='public' AND g.table_name=p.tablename
        AND g.grantee='authenticated' AND g.privilege_type='SELECT'
    )
)
SELECT * FROM (
  SELECT 'grants.anon_scope',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         'SELECT-only in whitelist', COALESCE(list,'-'),
         'anon com privilégios extras: ' || COALESCE(list,'')
    FROM anon_bad
  UNION ALL
  SELECT 'grants.service_role_full',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         'ALL on all tables', COALESCE(list,'-'),
         'service_role sem ALL em: ' || COALESCE(list,'')
    FROM service_missing
  UNION ALL
  SELECT 'grants.authenticated_matches_policies',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         'SELECT on policied tables', COALESCE(list,'-'),
         'authenticated sem SELECT em: ' || COALESCE(list,'')
    FROM authenticated_missing
) x;
