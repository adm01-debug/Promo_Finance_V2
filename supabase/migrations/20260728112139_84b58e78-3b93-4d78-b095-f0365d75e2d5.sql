ALTER TABLE public.performance_alerts
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_reason text;

CREATE INDEX IF NOT EXISTS idx_perf_alerts_open
  ON public.performance_alerts (created_at DESC)
  WHERE resolved_at IS NULL;

CREATE OR REPLACE FUNCTION public.watch_cron_failures(p_lookback_minutes integer DEFAULT 90, p_stale_hours integer DEFAULT 36)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'cron', 'pg_catalog'
AS $function$
DECLARE
  v_lookback integer := LEAST(GREATEST(COALESCE(p_lookback_minutes, 90), 5), 10080);
  v_stale    integer := LEAST(GREATEST(COALESCE(p_stale_hours, 36), 2), 720);
  v_fail     integer := 0;
  v_stalled  integer := 0;
  v_nunca    integer := 0;
  v_resolv   integer := 0;
  v_started  timestamptz := clock_timestamp();
BEGIN
  -- 1) Falhas recentes, agregadas por job.
  WITH falhas AS (
    SELECT
      j.jobname,
      count(*)::numeric AS total,
      max(d.end_time)   AS ultima,
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
        'return_message', left(coalesce(f.msg, ''), 500)
      )
    FROM falhas f
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO v_fail FROM ins;

  -- 2) Jobs sem execução, com tolerância derivada da expressão cron.
  WITH base AS (
    SELECT
      j.jobname,
      j.schedule,
      max(d.start_time) AS ultima,
      CASE
        WHEN split_part(j.schedule, ' ', 3) <> '*' THEN 24 * 35
        WHEN split_part(j.schedule, ' ', 5) <> '*' THEN 24 * 8
        WHEN split_part(j.schedule, ' ', 2) <> '*' THEN v_stale
        ELSE 3
      END AS tolerancia_h
    FROM cron.job j
    LEFT JOIN cron.job_run_details d ON d.jobid = j.jobid
    WHERE j.active
    GROUP BY j.jobname, j.schedule
  ),
  ins2 AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, metadata)
    SELECT
      'cron',
      'job_stale:' || b.jobname,
      'warning',
      format('Automação "%s" (%s) sem execução há mais de %s h',
             b.jobname, b.schedule, b.tolerancia_h),
      round(EXTRACT(epoch FROM (now() - b.ultima)) / 3600.0, 2),
      jsonb_build_object(
        'jobname', b.jobname, 'schedule', b.schedule,
        'last_run_at', b.ultima, 'tolerancia_horas', b.tolerancia_h
      )
    FROM base b
    WHERE b.ultima IS NOT NULL
      AND b.ultima < now() - make_interval(hours => b.tolerancia_h)
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  ),
  ins3 AS (
    INSERT INTO public.performance_alerts
      (source, alert_key, severity, reason, current_value, metadata)
    SELECT
      'cron',
      'job_never_ran:' || b.jobname,
      'info',
      format('Automação "%s" (%s) ainda não possui execução registrada',
             b.jobname, b.schedule),
      0,
      jsonb_build_object(
        'jobname', b.jobname, 'schedule', b.schedule,
        'tolerancia_horas', b.tolerancia_h
      )
    FROM base b
    WHERE b.ultima IS NULL
    ON CONFLICT (source, alert_key, alert_hour) DO NOTHING
    RETURNING 1
  )
  SELECT
    (SELECT count(*)::int FROM ins2),
    (SELECT count(*)::int FROM ins3)
  INTO v_stalled, v_nunca;

  -- 3) Encerramento automático: o alerta só existe enquanto o sintoma existir.
  --    Um job que voltou a rodar com sucesso depois do alerta deixa de ser incidente.
  WITH ultimo_ok AS (
    SELECT j.jobname, max(d.end_time) AS ok_em
    FROM cron.job_run_details d
    JOIN cron.job j ON j.jobid = d.jobid
    WHERE d.status = 'succeeded'
    GROUP BY j.jobname
  ), fechados AS (
    UPDATE public.performance_alerts a
    SET resolved_at = now(),
        resolved_reason = format('Automação "%s" executou com sucesso em %s',
                                 u.jobname, to_char(u.ok_em, 'DD/MM/YYYY HH24:MI'))
    FROM ultimo_ok u
    WHERE a.source = 'cron'
      AND a.resolved_at IS NULL
      AND a.alert_key IN ('job_failed:' || u.jobname,
                          'job_stale:' || u.jobname,
                          'job_never_ran:' || u.jobname)
      AND u.ok_em > a.created_at
    RETURNING 1
  )
  SELECT count(*)::int INTO v_resolv FROM fechados;

  RETURN jsonb_build_object(
    'ok', true,
    'lookback_minutes', v_lookback,
    'stale_hours_default', v_stale,
    'novos_alertas_falha', v_fail,
    'novos_alertas_sem_execucao', v_stalled,
    'novos_alertas_nunca_executou', v_nunca,
    'alertas_encerrados', v_resolv,
    'duration_ms', round(EXTRACT(epoch FROM (clock_timestamp() - v_started)) * 1000)
  );
END;
$function$;