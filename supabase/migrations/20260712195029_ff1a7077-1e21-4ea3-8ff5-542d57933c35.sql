CREATE OR REPLACE FUNCTION public.refresh_performance_alerts_weekly()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','pg_catalog'
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_rows BIGINT;
  v_spike_alerts INTEGER := 0;
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_performance_alerts_weekly;
  SELECT COUNT(*) INTO v_rows FROM public.mv_performance_alerts_weekly;

  -- Detecta spikes semanais >+50% em severidades acionáveis e insere meta-alertas
  WITH spikes AS (
    SELECT
      source,
      severity,
      week_start,
      alert_count,
      delta_pct_vs_prev_week
    FROM public.mv_performance_alerts_weekly
    WHERE severity IN ('critical','warning')
      AND delta_pct_vs_prev_week IS NOT NULL
      AND delta_pct_vs_prev_week >= 50
      AND alert_count >= 5
      AND week_start >= (date_trunc('week', now()))::date - INTERVAL '7 days'
  ), ins AS (
    INSERT INTO public.performance_alerts (
      source, alert_key, alert_hour, severity, reason,
      current_value, baseline_value, ratio, sample_count, metadata
    )
    SELECT
      'weekly_trend',
      format('spike:%s:%s:%s', source, severity, week_start),
      date_trunc('hour', now()),
      CASE WHEN delta_pct_vs_prev_week >= 100 OR severity = 'critical' THEN 'critical' ELSE 'warning' END,
      format('Spike semanal: %s alertas %s (+%s%% vs semana anterior)',
        alert_count, severity, round(delta_pct_vs_prev_week, 1)),
      alert_count::numeric,
      NULL,
      round(1 + (delta_pct_vs_prev_week / 100.0), 2),
      alert_count,
      jsonb_build_object(
        'source', source,
        'origin_severity', severity,
        'week_start', week_start,
        'delta_pct', delta_pct_vs_prev_week
      )
    FROM spikes
    ON CONFLICT (source, alert_key, alert_hour) DO UPDATE
      SET current_value = GREATEST(performance_alerts.current_value, EXCLUDED.current_value),
          ratio = GREATEST(performance_alerts.ratio, EXCLUDED.ratio),
          reason = EXCLUDED.reason,
          severity = CASE
            WHEN EXCLUDED.severity = 'critical' OR performance_alerts.severity = 'critical' THEN 'critical'
            ELSE 'warning'
          END
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_spike_alerts FROM ins;

  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  VALUES (
    'refresh_mv',
    'mv_performance_alerts_weekly',
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start))::integer,
    CASE WHEN v_spike_alerts > 0 THEN 'warning' ELSE 'info' END,
    format('rows=%s | spike_alerts=%s', v_rows, v_spike_alerts),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'rows', v_rows,
    'spike_alerts_created', v_spike_alerts,
    'duration_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start))::integer
  );
END;
$$;

COMMENT ON FUNCTION public.refresh_performance_alerts_weekly() IS
  'Atualiza mv_performance_alerts_weekly e cria meta-alertas quando delta semanal >= 50% em severidades crítica/aviso (spike detection).';