-- Materialized view: tendências semanais de regressões
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_performance_alerts_weekly AS
WITH weekly AS (
  SELECT
    date_trunc('week', created_at)::date AS week_start,
    source,
    severity,
    COUNT(*) AS alert_count,
    COUNT(DISTINCT alert_key) AS distinct_keys,
    ROUND(AVG(NULLIF(current_value, 0))::numeric, 2) AS avg_current_ms,
    ROUND(MAX(current_value)::numeric, 2) AS max_current_ms,
    ROUND(AVG(NULLIF(ratio, 0))::numeric, 2) AS avg_ratio,
    ROUND(MAX(ratio)::numeric, 2) AS max_ratio,
    SUM(COALESCE(sample_count, 0)) AS total_samples
  FROM public.performance_alerts
  WHERE created_at > now() - INTERVAL '90 days'
  GROUP BY 1, 2, 3
)
SELECT
  week_start,
  source,
  severity,
  alert_count,
  distinct_keys,
  avg_current_ms,
  max_current_ms,
  avg_ratio,
  max_ratio,
  total_samples,
  -- Delta % vs semana anterior (mesma origem+severidade)
  ROUND(
    (
      (alert_count::numeric - LAG(alert_count) OVER (PARTITION BY source, severity ORDER BY week_start))
      / NULLIF(LAG(alert_count) OVER (PARTITION BY source, severity ORDER BY week_start), 0)
    ) * 100, 1
  ) AS delta_pct_vs_prev_week,
  now() AS refreshed_at
FROM weekly
ORDER BY week_start DESC, source, severity;

CREATE UNIQUE INDEX IF NOT EXISTS mv_performance_alerts_weekly_pk
  ON public.mv_performance_alerts_weekly (week_start, source, severity);

CREATE INDEX IF NOT EXISTS mv_performance_alerts_weekly_week_idx
  ON public.mv_performance_alerts_weekly (week_start DESC);

-- Permissões: admins consultam via função RPC (não exposto direto)
REVOKE ALL ON public.mv_performance_alerts_weekly FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.mv_performance_alerts_weekly TO service_role;

-- Função para refresh (admin only)
CREATE OR REPLACE FUNCTION public.refresh_performance_alerts_weekly()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','pg_catalog'
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_rows BIGINT;
BEGIN
  -- CONCURRENTLY exige unique index (já criado)
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_performance_alerts_weekly;

  SELECT COUNT(*) INTO v_rows FROM public.mv_performance_alerts_weekly;

  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  VALUES (
    'refresh_mv',
    'mv_performance_alerts_weekly',
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start))::integer,
    'info',
    format('rows=%s', v_rows),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'rows', v_rows,
    'duration_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start))::integer
  );
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_performance_alerts_weekly() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_performance_alerts_weekly() TO service_role, postgres;

-- RPC pública para admins consultarem tendências
CREATE OR REPLACE FUNCTION public.get_performance_alerts_weekly(p_weeks integer DEFAULT 12)
RETURNS TABLE(
  week_start date,
  source text,
  severity text,
  alert_count bigint,
  distinct_keys bigint,
  avg_current_ms numeric,
  max_current_ms numeric,
  avg_ratio numeric,
  max_ratio numeric,
  total_samples numeric,
  delta_pct_vs_prev_week numeric,
  refreshed_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public','pg_catalog'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar tendências.';
  END IF;

  RETURN QUERY
  SELECT mv.week_start, mv.source, mv.severity, mv.alert_count, mv.distinct_keys,
         mv.avg_current_ms, mv.max_current_ms, mv.avg_ratio, mv.max_ratio,
         mv.total_samples::numeric, mv.delta_pct_vs_prev_week, mv.refreshed_at
  FROM public.mv_performance_alerts_weekly mv
  WHERE mv.week_start > (now() - make_interval(weeks => GREATEST(p_weeks, 1)))::date
  ORDER BY mv.week_start DESC, mv.source, mv.severity;
END;
$$;

REVOKE ALL ON FUNCTION public.get_performance_alerts_weekly(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_performance_alerts_weekly(integer) TO authenticated, service_role;

-- Refresh inicial
REFRESH MATERIALIZED VIEW public.mv_performance_alerts_weekly;

-- Agenda cron diário às 03:45 UTC (após retention e bloat)
SELECT cron.unschedule('refresh-performance-alerts-weekly')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-performance-alerts-weekly');

SELECT cron.schedule(
  'refresh-performance-alerts-weekly',
  '45 3 * * *',
  $$SELECT public.refresh_performance_alerts_weekly();$$
);