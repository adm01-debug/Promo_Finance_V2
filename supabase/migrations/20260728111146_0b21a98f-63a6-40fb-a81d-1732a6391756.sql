-- =====================================================================
-- Melhoria #17 — Vigilância de execuções agendadas (pg_cron)
-- Gap coberto: jobs podiam falhar silenciosamente; nada observava
-- cron.job_run_details. Agora falhas viram alerta crítico e jobs
-- "mudos" (sem execução recente) viram aviso.
-- =====================================================================

-- 1) A CHECK de `source` só admitia telemetria de queries.
ALTER TABLE public.performance_alerts
  DROP CONSTRAINT IF EXISTS performance_alerts_source_check;

ALTER TABLE public.performance_alerts
  ADD CONSTRAINT performance_alerts_source_check
  CHECK (source = ANY (ARRAY['query_telemetry'::text, 'pg_stat_statements'::text, 'cron'::text]));

-- 2) Watcher. SECURITY DEFINER porque `cron` não é legível por
--    authenticated/service_role; search_path fixo e sem EXCEPTION
--    genérico (falha deve ser visível no log do job).
CREATE OR REPLACE FUNCTION public.watch_cron_failures(
  p_lookback_minutes integer DEFAULT 90,
  p_stale_hours      integer DEFAULT 36
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'cron', 'pg_catalog'
AS $$
DECLARE
  v_lookback integer := LEAST(GREATEST(COALESCE(p_lookback_minutes, 90), 5), 10080);
  v_stale    integer := LEAST(GREATEST(COALESCE(p_stale_hours, 36), 2), 720);
  v_fail     integer := 0;
  v_stalled  integer := 0;
  v_started  timestamptz := clock_timestamp();
BEGIN
  -- 2a) Execuções que falharam na janela recente, agregadas por job.
  WITH falhas AS (
    SELECT
      j.jobname,
      count(*)::numeric              AS total,
      max(d.end_time)                AS ultima,
      (array_agg(d.return_message ORDER BY d.start_time DESC))[1] AS msg
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
    WHERE d.status = 'failed'
      AND d.start_time >= now() - make_interval(mins => v_lookback)
    GROUP BY j.jobname
  ), ins AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, sample_count, metadata)
    SELECT
      'cron',
      'job_failed:' || f.jobname,
      'critical',
      format('Automação "%s" falhou %s vez(es) nos últimos %s min', f.jobname, f.total, v_lookback),
      f.total,
      f.total::int,
      jsonb_build_object(
        'jobname', f.jobname,
        'last_failure_at', f.ultima,
        -- mensagem do Postgres pode ser longa; truncamos para o payload
        'return_message', left(coalesce(f.msg, ''), 500)
      )
    FROM falhas f
    -- dedupe por (source, alert_key, alert_hour): 1 alerta por job/hora
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO v_fail FROM ins;

  -- 2b) Jobs ativos que não executam há tempo demais (cron parado,
  --     job desagendado por engano, worker travado).
  WITH mudos AS (
    SELECT
      j.jobname,
      max(d.start_time) AS ultima
    FROM cron.job j
    LEFT JOIN cron.job_run_details d ON d.jobid = j.jobid
    WHERE j.active
    GROUP BY j.jobname
    HAVING max(d.start_time) IS NULL
        OR max(d.start_time) < now() - make_interval(hours => v_stale)
  ), ins2 AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, metadata)
    SELECT
      'cron',
      'job_stale:' || m.jobname,
      'warning',
      format(
        'Automação "%s" sem execução registrada há mais de %s h',
        m.jobname, v_stale
      ),
      COALESCE(round(EXTRACT(epoch FROM (now() - m.ultima)) / 3600.0, 2), v_stale),
      jsonb_build_object('jobname', m.jobname, 'last_run_at', m.ultima)
    FROM mudos m
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO v_stalled FROM ins2;

  RETURN jsonb_build_object(
    'ok', true,
    'lookback_minutes', v_lookback,
    'stale_hours', v_stale,
    'novos_alertas_falha', v_fail,
    'novos_alertas_sem_execucao', v_stalled,
    'duration_ms', round(EXTRACT(epoch FROM (clock_timestamp() - v_started)) * 1000)
  );
END;
$$;

-- 3) Superfície mínima: só o próprio agendador executa.
REVOKE ALL ON FUNCTION public.watch_cron_failures(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.watch_cron_failures(integer, integer) TO service_role;

COMMENT ON FUNCTION public.watch_cron_failures(integer, integer) IS
  'Melhoria #17: converte falhas e ausência de execuções do pg_cron em registros de public.performance_alerts (dedupe horário).';

-- 4) Agendamento horário, idempotente por nome.
DO $do$
BEGIN
  PERFORM cron.unschedule('cron-failure-watch')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cron-failure-watch');

  PERFORM cron.schedule(
    'cron-failure-watch',
    '10 * * * *',
    $cmd$ SELECT public.watch_cron_failures(90, 36); $cmd$
  );
END
$do$;