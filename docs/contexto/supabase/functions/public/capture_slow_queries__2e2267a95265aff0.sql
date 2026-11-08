CREATE OR REPLACE FUNCTION public.capture_slow_queries(threshold_ms numeric DEFAULT 500)
 RETURNS TABLE(captured integer, deleted_old integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  v_captured INTEGER := 0;
  v_deleted INTEGER := 0;
  v_has_pgss BOOLEAN;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtext('capture_slow_queries')) THEN
    RETURN QUERY SELECT 0, 0; RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') INTO v_has_pgss;
  IF NOT v_has_pgss THEN
    RETURN QUERY SELECT 0, 0; RETURN;
  END IF;

  DELETE FROM public.slow_query_alerts WHERE captured_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  WITH slow AS (
    SELECT s.queryid, LEFT(regexp_replace(s.query, '\s+', ' ', 'g'), 2000) AS query_normalized,
           s.calls, ROUND(s.mean_exec_time::numeric, 3) AS mean_exec_ms,
           ROUND(s.total_exec_time::numeric, 3) AS total_exec_ms,
           ROUND(s.max_exec_time::numeric, 3) AS max_exec_ms,
           s.rows AS rows_returned,
           CASE WHEN s.mean_exec_time >= 2000 THEN 'critical'
                WHEN s.mean_exec_time >= 1000 THEN 'warning'
                ELSE 'info' END AS severity
    FROM extensions.pg_stat_statements s
    WHERE s.mean_exec_time >= threshold_ms
      AND s.query !~* '^\s*(EXPLAIN|SET|SHOW|BEGIN|COMMIT|ROLLBACK|DEALLOCATE)'
      AND s.query !~* 'pg_stat_statements|capture_slow_queries'
    ORDER BY s.mean_exec_time DESC LIMIT 20
  ), ins AS (
    INSERT INTO public.slow_query_alerts (
      queryid, query_normalized, calls, mean_exec_ms,
      total_exec_ms, max_exec_ms, rows_returned, severity
    )
    SELECT queryid, query_normalized, calls, mean_exec_ms,
           total_exec_ms, max_exec_ms, rows_returned, severity FROM slow
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_captured FROM ins;

  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  SELECT 'slow_query_capture', 'pg_stat_statements',
         LEAST(mean_exec_ms::integer, 2147483647), severity,
         LEFT(query_normalized, 500), now()
  FROM public.slow_query_alerts
  WHERE captured_at > now() - INTERVAL '1 minute'
    AND severity IN ('warning','critical');

  RETURN QUERY SELECT v_captured, v_deleted;
END;
$function$
