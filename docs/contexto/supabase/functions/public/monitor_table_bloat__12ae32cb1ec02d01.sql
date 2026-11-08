CREATE OR REPLACE FUNCTION public.monitor_table_bloat()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_row RECORD;
  v_alerts INT := 0;
  v_total_size_mb NUMERIC := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtext('monitor_table_bloat')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  FOR v_row IN
    SELECT s.relname, s.n_dead_tup, s.n_live_tup,
           pg_total_relation_size(s.relid) AS total_bytes,
           CASE WHEN (s.n_live_tup + s.n_dead_tup) > 0
                THEN (s.n_dead_tup::numeric / (s.n_live_tup + s.n_dead_tup)) * 100
                ELSE 0 END AS dead_ratio
    FROM pg_stat_user_tables s
    WHERE s.schemaname = 'public' AND s.n_live_tup + s.n_dead_tup > 1000
  LOOP
    v_total_size_mb := v_total_size_mb + (v_row.total_bytes::numeric / (1024*1024));
    IF v_row.dead_ratio >= 20 OR v_row.total_bytes >= 100 * 1024 * 1024 THEN
      INSERT INTO public.query_telemetry (
        operation, table_name, duration_ms, severity, error_message, created_at
      ) VALUES (
        'bloat_monitor', v_row.relname, 0,
        CASE WHEN v_row.dead_ratio >= 40 THEN 'critical'
             WHEN v_row.dead_ratio >= 20 THEN 'warning'
             ELSE 'info' END,
        format('dead=%s%% live=%s dead=%s size_mb=%s',
               round(v_row.dead_ratio,2), v_row.n_live_tup, v_row.n_dead_tup,
               round((v_row.total_bytes::numeric/1024/1024),2)),
        now()
      );
      v_alerts := v_alerts + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('alerts', v_alerts,
    'total_size_mb', round(v_total_size_mb, 2), 'executed_at', now());
END;
$function$
