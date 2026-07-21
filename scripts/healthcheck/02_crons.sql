-- 02_crons.sql — valida que cron.job existe, está ativo e teve execuções recentes.
-- Emite linhas JSONL em stdout via psql -Atc-like RAISE NOTICE — mas usamos SELECT
-- com format() para permitir grep '^{' em run.sh.
\set QUIET on
\pset format unaligned
\pset tuples_only on
\pset border 0
\set ON_ERROR_STOP off

DO $$
DECLARE
  r record;
  total int;
  active int;
  recent int;
  failed int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE '%', jsonb_build_object(
      'ts', to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'check','crons','target','pg_cron','status','unverified',
      'detail','extension pg_cron ausente','run_id', current_setting('app.hc_run_id', true)
    );
    RETURN;
  END IF;

  SELECT count(*), count(*) FILTER (WHERE active) INTO total, active FROM cron.job;

  RAISE NOTICE '%', jsonb_build_object(
    'ts', to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'check','crons','target','registry',
    'status', CASE WHEN active >= 1 THEN 'pass' ELSE 'fail' END,
    'detail', format('jobs total=%s active=%s', total, active),
    'run_id', current_setting('app.hc_run_id', true)
  );

  -- Execuções recentes (últimos 15 min) por job
  FOR r IN
    SELECT j.jobname,
           count(*) FILTER (WHERE d.status = 'succeeded') AS ok,
           count(*) FILTER (WHERE d.status IN ('failed','failure')) AS ko,
           max(d.end_time) AS last_end,
           max(d.status) FILTER (WHERE d.status IN ('failed','failure')) AS last_fail_status,
           (array_agg(d.return_message ORDER BY d.end_time DESC)
              FILTER (WHERE d.status IN ('failed','failure')))[1] AS last_err
      FROM cron.job j
      LEFT JOIN cron.job_run_details d
        ON d.jobid = j.jobid AND d.end_time > now() - interval '15 minutes'
     WHERE j.active
     GROUP BY j.jobname
     ORDER BY j.jobname
  LOOP
    IF r.ko > 0 THEN
      RAISE NOTICE '%', jsonb_build_object(
        'ts', to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'check','crons','target', r.jobname,
        'status','fail',
        'detail', format('failures=%s last_err=%s', r.ko, left(coalesce(r.last_err,''), 160)),
        'run_id', current_setting('app.hc_run_id', true)
      );
    ELSIF r.ok >= 1 THEN
      RAISE NOTICE '%', jsonb_build_object(
        'ts', to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'check','crons','target', r.jobname,
        'status','pass',
        'detail', format('runs_15min=%s last_end=%s', r.ok, r.last_end),
        'run_id', current_setting('app.hc_run_id', true)
      );
    ELSE
      -- Sem execução na janela: unverified (pode ser cron de baixa frequência)
      RAISE NOTICE '%', jsonb_build_object(
        'ts', to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'check','crons','target', r.jobname,
        'status','unverified',
        'detail','sem execução nos últimos 15min',
        'run_id', current_setting('app.hc_run_id', true)
      );
    END IF;
  END LOOP;
END $$;
