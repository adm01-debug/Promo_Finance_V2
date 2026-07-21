-- 05_crons.sql — Cron jobs presentes, ativos, schedule esperado e execução recente.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH
expected AS (
  SELECT
    (elem->>'jobname')::text AS jobname,
    (elem->>'schedule')::text AS schedule
  FROM jsonb_array_elements((:'expected_crons')::jsonb) AS elem
),
active AS (
  SELECT jobname, schedule
  FROM cron.job
  WHERE active = true
),
missing AS (
  SELECT string_agg(jobname, ',') AS list
  FROM expected e
  WHERE NOT EXISTS (SELECT 1 FROM active a WHERE a.jobname = e.jobname)
),
mismatched AS (
  SELECT string_agg(e.jobname || ':' || e.schedule || '!=' || a.schedule, ',') AS list
  FROM expected e
  JOIN active a ON a.jobname = e.jobname
  WHERE a.schedule <> e.schedule
),
counts AS (
  SELECT
    (SELECT count(*) FROM active)                   AS n_active,
    (SELECT count(*) FROM expected)                 AS n_expected,
    (SELECT count(*) FROM cron.job_run_details
      WHERE start_time > now() - interval '5 minutes') AS recent_runs
)
SELECT * FROM (
  SELECT 'crons.active_count',
         CASE WHEN n_active >= n_expected THEN 'pass' ELSE 'fail' END,
         n_expected::text, n_active::text, ''
    FROM counts
  UNION ALL
  SELECT 'crons.all_expected_present',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         'all', COALESCE(list,'-'), 'faltando: ' || COALESCE(list,'')
    FROM missing
  UNION ALL
  SELECT 'crons.schedules_match',
         CASE WHEN list IS NULL THEN 'pass' ELSE 'fail' END,
         'exact', COALESCE(list,'-'), 'schedules divergentes: ' || COALESCE(list,'')
    FROM mismatched
  UNION ALL
  SELECT 'crons.recent_activity',
         CASE WHEN recent_runs > 0 THEN 'pass' ELSE 'unverified' END,
         '>0 em 5min', recent_runs::text,
         'sem execuções recentes — pode ser normal se acabou de subir'
    FROM counts
) x;
