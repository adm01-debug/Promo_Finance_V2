-- =====================================================================
-- ITEM 39 — Monitor de bloat (v_table_bloat + monitor_table_bloat)
-- =====================================================================

-- View de bloat baseada em pg_stat_user_tables
CREATE OR REPLACE VIEW public.v_table_bloat
WITH (security_invoker = true)
AS
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE WHEN (n_live_tup + n_dead_tup) > 0
       THEN round((n_dead_tup::numeric / (n_live_tup + n_dead_tup)) * 100, 2)
       ELSE 0
  END AS dead_ratio_pct,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size_pretty,
  pg_total_relation_size(relid) AS total_size_bytes,
  pg_size_pretty(pg_relation_size(relid)) AS table_size_pretty,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  vacuum_count,
  autovacuum_count,
  analyze_count,
  autoanalyze_count
FROM pg_stat_user_tables
WHERE schemaname = 'public';

REVOKE ALL ON public.v_table_bloat FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_table_bloat TO service_role;

-- Função de monitoramento diária
CREATE OR REPLACE FUNCTION public.monitor_table_bloat()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','pg_catalog'
AS $$
DECLARE
  v_row RECORD;
  v_alerts INT := 0;
  v_total_size_mb NUMERIC := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('monitor_table_bloat')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  FOR v_row IN
    SELECT s.relname,
           s.n_dead_tup,
           s.n_live_tup,
           pg_total_relation_size(s.relid) AS total_bytes,
           CASE WHEN (s.n_live_tup + s.n_dead_tup) > 0
                THEN (s.n_dead_tup::numeric / (s.n_live_tup + s.n_dead_tup)) * 100
                ELSE 0 END AS dead_ratio
    FROM pg_stat_user_tables s
    WHERE s.schemaname = 'public'
      AND s.n_live_tup + s.n_dead_tup > 1000
  LOOP
    v_total_size_mb := v_total_size_mb + (v_row.total_bytes::numeric / (1024*1024));

    IF v_row.dead_ratio >= 20 OR v_row.total_bytes >= 100 * 1024 * 1024 THEN
      INSERT INTO public.query_telemetry (
        operation, table_name, duration_ms, severity, error_message, created_at
      ) VALUES (
        'bloat_monitor',
        v_row.relname,
        0,
        CASE
          WHEN v_row.dead_ratio >= 40 THEN 'critical'
          WHEN v_row.dead_ratio >= 20 THEN 'warning'
          ELSE 'info'
        END,
        format('dead=%s%% live=%s dead=%s size_mb=%s',
               round(v_row.dead_ratio,2), v_row.n_live_tup, v_row.n_dead_tup,
               round((v_row.total_bytes::numeric/1024/1024),2)),
        now()
      );
      v_alerts := v_alerts + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'alerts', v_alerts,
    'total_size_mb', round(v_total_size_mb, 2),
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.monitor_table_bloat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monitor_table_bloat() TO service_role;

-- Agendamento diário (03:15 UTC) — idempotente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('monitor-table-bloat-daily')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='monitor-table-bloat-daily');
    PERFORM cron.schedule(
      'monitor-table-bloat-daily',
      '15 3 * * *',
      $c$SELECT public.monitor_table_bloat();$c$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END $$;

INSERT INTO public.audit_logs (
  table_name, record_id, action, details, user_id, user_email, created_at
) VALUES (
  '_meta_hardening', gen_random_uuid(), 'ITEM_39',
  'Table bloat monitor (view + function + cron) applied',
  NULL, 'system', now()
);
