-- 01_schema.sql — Parity de objetos do schema public vs. baseline.
-- Cada linha: assertion \t status \t expected \t actual \t detail
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH
counts AS (
  SELECT
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r') AS tables,
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='v') AS views,
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='i') AS indexes,
    (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public') AS functions,
    (SELECT count(*) FROM pg_policies WHERE schemaname='public') AS policies
),
baseline AS (
  SELECT (:'baseline_counts')::jsonb AS b
),
expected_ext AS (
  SELECT unnest(ARRAY['pgcrypto','pg_cron','pg_net','pg_stat_statements','pg_trgm','vector']) AS name
),
missing_ext AS (
  SELECT string_agg(e.name, ',') AS list
  FROM expected_ext e
  LEFT JOIN pg_extension x ON x.extname = e.name
  WHERE x.extname IS NULL
),
missing_parts AS (
  SELECT string_agg(missing, ',') AS list FROM (
    SELECT format('%s_%s', tbl, to_char(m, 'YYYY_MM')) AS missing
    FROM (VALUES ('audit_logs'), ('frontend_error_logs')) AS t(tbl),
         generate_series(date_trunc('month', now()),
                         date_trunc('month', now()) + interval '3 months',
                         interval '1 month') AS m
    WHERE NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public'
        AND c.relname = format('%s_%s', tbl, to_char(m, 'YYYY_MM'))
    )
  ) s
)
SELECT * FROM (
  -- Comparações de contagem: fail se diferença > 0
  SELECT 'schema.tables_count',
         CASE WHEN (b->>'tables')::int = tables THEN 'pass' ELSE 'fail' END,
         COALESCE(b->>'tables','?'), tables::text, ''
    FROM counts, baseline
  UNION ALL
  SELECT 'schema.views_count',
         CASE WHEN (b->>'views')::int = views THEN 'pass' ELSE 'fail' END,
         COALESCE(b->>'views','?'), views::text, ''
    FROM counts, baseline
  UNION ALL
  SELECT 'schema.indexes_count',
         CASE WHEN (b->>'indexes')::int <= indexes THEN 'pass' ELSE 'fail' END,
         COALESCE(b->>'indexes','?'), indexes::text, 'staging deve ter >= baseline'
    FROM counts, baseline
  UNION ALL
  SELECT 'schema.functions_count',
         CASE WHEN (b->>'functions')::int <= functions THEN 'pass' ELSE 'fail' END,
         COALESCE(b->>'functions','?'), functions::text, ''
    FROM counts, baseline
  UNION ALL
  SELECT 'schema.policies_count',
         CASE WHEN (b->>'policies')::int <= policies THEN 'pass' ELSE 'fail' END,
         COALESCE(b->>'policies','?'), policies::text, ''
    FROM counts, baseline
  UNION ALL
  SELECT 'schema.extensions',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         'all-present', COALESCE(list,'-'), 'faltando: ' || COALESCE(list,'')
    FROM missing_ext
  UNION ALL
  SELECT 'schema.monthly_partitions',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         'current+3', COALESCE(list,'-'), 'partições ausentes: ' || COALESCE(list,'')
    FROM missing_parts
) x;
