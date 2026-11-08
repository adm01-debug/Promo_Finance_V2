CREATE OR REPLACE FUNCTION public.detect_query_regressions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_alerts_qt INTEGER := 0;
  v_alerts_pgss INTEGER := 0;
  v_deleted INTEGER := 0;
  v_has_pgss BOOLEAN;
BEGIN
  -- Advisory lock: evita execução concorrente
  IF NOT pg_try_advisory_xact_lock(hashtext('detect_query_regressions')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  ------------------------------------------------------------------
  -- A) Regressões em query_telemetry (janela 15min vs baseline 7d)
  ------------------------------------------------------------------
  WITH recent AS (
    SELECT
      COALESCE(rpc_name, table_name, operation) AS alert_key,
      operation,
      table_name,
      rpc_name,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric AS p95_ms,
      COUNT(*) AS n
    FROM public.query_telemetry
    WHERE created_at > now() - INTERVAL '15 minutes'
      AND operation NOT IN ('slow_query_capture','perf_alert','bloat_monitor')
      AND duration_ms IS NOT NULL
    GROUP BY 1, 2, 3, 4
    HAVING COUNT(*) >= 5
  ),
  baseline AS (
    SELECT
      COALESCE(rpc_name, table_name, operation) AS alert_key,
      percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms)::numeric AS median_ms,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric AS p95_baseline
    FROM public.query_telemetry
    WHERE created_at BETWEEN now() - INTERVAL '7 days' AND now() - INTERVAL '15 minutes'
      AND operation NOT IN ('slow_query_capture','perf_alert','bloat_monitor')
      AND duration_ms IS NOT NULL
    GROUP BY 1
    HAVING COUNT(*) >= 20
  ),
  regressions AS (
    SELECT
      r.alert_key,
      r.operation,
      r.table_name,
      r.rpc_name,
      r.p95_ms AS current_p95,
      b.p95_baseline AS baseline_p95,
      b.median_ms AS baseline_median,
      r.n AS sample_count,
      CASE
        WHEN r.p95_ms >= 3000 OR r.p95_ms >= 3 * b.p95_baseline THEN 'critical'
        WHEN r.p95_ms >= 1000 OR r.p95_ms >= 2 * b.p95_baseline THEN 'warning'
        ELSE 'info'
      END AS severity
    FROM recent r
    JOIN baseline b USING (alert_key)
    WHERE r.p95_ms >= 500
      AND r.p95_ms >= 2 * NULLIF(b.p95_baseline, 0)
  ), ins AS (
    INSERT INTO public.performance_alerts (
      source, alert_key, alert_hour, severity, reason,
      current_value, baseline_value, ratio, sample_count, metadata
    )
    SELECT
      'query_telemetry',
      alert_key,
      date_trunc('hour', now()),
      severity,
      format('p95 %sms (baseline %sms) — regressão %sx',
        round(current_p95), round(baseline_p95),
        round(current_p95 / NULLIF(baseline_p95, 0), 2)),
      round(current_p95, 2),
      round(baseline_p95, 2),
      round(current_p95 / NULLIF(baseline_p95, 0), 2),
      sample_count,
      jsonb_build_object(
        'operation', operation,
        'table_name', table_name,
        'rpc_name', rpc_name,
        'baseline_median_ms', round(baseline_median, 2)
      )
    FROM regressions
    ON CONFLICT (source, alert_key, alert_hour) DO UPDATE
      SET severity = CASE
        WHEN EXCLUDED.severity = 'critical' THEN 'critical'
        WHEN performance_alerts.severity = 'critical' THEN 'critical'
        WHEN EXCLUDED.severity = 'warning' OR performance_alerts.severity = 'warning' THEN 'warning'
        ELSE 'info'
      END,
      current_value = GREATEST(performance_alerts.current_value, EXCLUDED.current_value),
      ratio = GREATEST(performance_alerts.ratio, EXCLUDED.ratio),
      reason = EXCLUDED.reason
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_alerts_qt FROM ins;

  ------------------------------------------------------------------
  -- B) Thresholds absolutos em pg_stat_statements
  ------------------------------------------------------------------
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')
    INTO v_has_pgss;

  IF v_has_pgss THEN
    WITH pgss AS (
      SELECT
        s.queryid::text AS alert_key,
        LEFT(regexp_replace(s.query, '\s+', ' ', 'g'), 500) AS snippet,
        s.calls,
        s.mean_exec_time AS mean_ms,
        s.max_exec_time AS max_ms,
        CASE
          WHEN s.mean_exec_time >= 3000 THEN 'critical'
          WHEN s.mean_exec_time >= 1000 THEN 'warning'
          WHEN s.mean_exec_time >= 300 THEN 'info'
          ELSE NULL
        END AS severity
      FROM extensions.pg_stat_statements s
      WHERE s.calls >= 20
        AND s.mean_exec_time >= 300
        AND s.query !~* '^\s*(EXPLAIN|SET|SHOW|BEGIN|COMMIT|ROLLBACK|DEALLOCATE|VACUUM|ANALYZE)'
        AND s.query !~* 'pg_stat_statements|detect_query_regressions|capture_slow_queries|monitor_table_bloat|snapshot_table_bloat'
    ), ins AS (
      INSERT INTO public.performance_alerts (
        source, alert_key, alert_hour, severity, reason,
        current_value, baseline_value, ratio, sample_count,
        query_snippet, metadata
      )
      SELECT
        'pg_stat_statements',
        alert_key,
        date_trunc('hour', now()),
        severity,
        format('mean_exec %sms em %s execuções (max %sms)',
          round(mean_ms::numeric, 1), calls, round(max_ms::numeric, 1)),
        round(mean_ms::numeric, 2),
        NULL,
        NULL,
        calls,
        snippet,
        jsonb_build_object('max_exec_ms', round(max_ms::numeric, 2))
      FROM pgss
      WHERE severity IS NOT NULL
      ON CONFLICT (source, alert_key, alert_hour) DO UPDATE
        SET severity = CASE
          WHEN EXCLUDED.severity = 'critical' THEN 'critical'
          WHEN performance_alerts.severity = 'critical' THEN 'critical'
          WHEN EXCLUDED.severity = 'warning' OR performance_alerts.severity = 'warning' THEN 'warning'
          ELSE 'info'
        END,
        current_value = GREATEST(performance_alerts.current_value, EXCLUDED.current_value),
        sample_count = EXCLUDED.sample_count,
        reason = EXCLUDED.reason,
        query_snippet = EXCLUDED.query_snippet
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_alerts_pgss FROM ins;
  END IF;

  ------------------------------------------------------------------
  -- C) Retenção: 30 dias
  ------------------------------------------------------------------
  DELETE FROM public.performance_alerts
   WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  ------------------------------------------------------------------
  -- D) Espelhar métricas no dashboard unificado
  ------------------------------------------------------------------
  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  VALUES (
    'perf_alert',
    'performance_alerts',
    (v_alerts_qt + v_alerts_pgss),
    CASE WHEN (v_alerts_qt + v_alerts_pgss) = 0 THEN 'info'
         WHEN (v_alerts_qt + v_alerts_pgss) >= 5 THEN 'warning'
         ELSE 'info' END,
    format('QT=%s | PGSS=%s | deleted=%s', v_alerts_qt, v_alerts_pgss, v_deleted),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'alerts_query_telemetry', v_alerts_qt,
    'alerts_pg_stat_statements', v_alerts_pgss,
    'deleted_old', v_deleted,
    'duration_ms', EXTRACT(MILLISECONDS FROM (now() - v_start))::integer
  );
END;
$function$
