-- Reforça autorização em funções SECURITY DEFINER de observabilidade.
-- Regra: permite execução por processos internos (auth.uid() IS NULL — cron/service_role)
-- ou por usuários com papel 'admin'. Bloqueia qualquer chamada autenticada não-admin.
-- Também revoga EXECUTE de PUBLIC/anon como defense-in-depth.

-- 1) capture_pg_stat_statements_baseline(text)
CREATE OR REPLACE FUNCTION public.capture_pg_stat_statements_baseline(p_label text)
 RETURNS TABLE(captured_rows bigint, label text, captured_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_captured_at TIMESTAMPTZ := now();
  v_count BIGINT;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.pg_stat_statements_baseline (
    label, queryid, query, calls, total_exec_time, mean_exec_time,
    max_exec_time, rows, shared_blks_hit, shared_blks_read, captured_at
  )
  SELECT p_label, s.queryid, LEFT(s.query, 2000), s.calls, s.total_exec_time,
         s.mean_exec_time, s.max_exec_time, s.rows, s.shared_blks_hit,
         s.shared_blks_read, v_captured_at
  FROM extensions.pg_stat_statements s
  WHERE s.dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
    AND s.query NOT ILIKE '%pg_stat_statements%';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count, p_label, v_captured_at;
END;
$function$;

-- 2) capture_slow_queries(numeric)
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
$function$;

-- 3) monitor_table_bloat()
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
$function$;

-- 4) snapshot_table_bloat() — recria com guard preservando corpo original
DO $mig$
DECLARE
  v_def text;
  v_body text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'snapshot_table_bloat'
  LIMIT 1;

  IF v_def IS NULL THEN RETURN; END IF;

  -- Se já contém has_role, nada a fazer
  IF v_def ILIKE '%has_role%' THEN RETURN; END IF;

  -- Injeta guard logo após o primeiro BEGIN do corpo
  v_body := regexp_replace(
    v_def,
    'AS \$function\$\s*(DECLARE.*?)?BEGIN',
    'AS $function$ \1BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), ''admin'') THEN
    RAISE EXCEPTION ''access denied: admin role required'' USING ERRCODE = ''42501'';
  END IF;
',
    'is'
  );

  EXECUTE v_body;
END;
$mig$;

-- 5) refresh_performance_alerts_weekly() — mesmo tratamento seguro
DO $mig$
DECLARE
  v_def text;
  v_body text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'refresh_performance_alerts_weekly'
  LIMIT 1;

  IF v_def IS NULL OR v_def ILIKE '%has_role%' THEN RETURN; END IF;

  v_body := regexp_replace(
    v_def,
    'AS \$function\$\s*(DECLARE.*?)?BEGIN',
    'AS $function$ \1BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), ''admin'') THEN
    RAISE EXCEPTION ''access denied: admin role required'' USING ERRCODE = ''42501'';
  END IF;
',
    'is'
  );

  EXECUTE v_body;
END;
$mig$;

-- 6) sefaz_run_observability_checks()
DO $mig$
DECLARE
  v_def text;
  v_body text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'sefaz_run_observability_checks'
  LIMIT 1;

  IF v_def IS NULL OR v_def ILIKE '%has_role%' THEN RETURN; END IF;

  v_body := regexp_replace(
    v_def,
    'AS \$function\$\s*(DECLARE.*?)?BEGIN',
    'AS $function$ \1BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), ''admin'') THEN
    RAISE EXCEPTION ''access denied: admin role required'' USING ERRCODE = ''42501'';
  END IF;
',
    'is'
  );

  EXECUTE v_body;
END;
$mig$;

-- Defense-in-depth: revoga EXECUTE de PUBLIC/anon nas funções de observabilidade.
-- (Cron/service_role continuam podendo executar; frontend admin usa RPCs específicas com guard já existente.)
REVOKE EXECUTE ON FUNCTION public.capture_pg_stat_statements_baseline(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.capture_slow_queries(numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.monitor_table_bloat() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.snapshot_table_bloat() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.refresh_performance_alerts_weekly() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sefaz_run_observability_checks() FROM PUBLIC, anon;