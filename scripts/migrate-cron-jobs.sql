-- scripts/migrate-cron-jobs.sql
-- Recria os 14 cron jobs do projeto de origem no projeto de destino.
--
-- Placeholders substituídos por envsubst no wrapper migrate-cron-jobs.sh:
--   ${PROJECT_REF}  → ref do projeto destino
--   ${ANON_KEY}     → anon key do destino
--
-- Idempotente: cada job é desagendado (se existir) antes de recriar.
-- Requer extensões: pg_cron, pg_net (para o job evaluate-delivery-alerts).

BEGIN;

-- Helper: unschedule seguro (sem erro se o job não existir)
CREATE OR REPLACE FUNCTION pg_temp.safe_unschedule(p_name text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = p_name) THEN
    PERFORM cron.unschedule(p_name);
  END IF;
END; $$;

-- 1. capture-slow-queries — a cada 15 min
SELECT pg_temp.safe_unschedule('capture-slow-queries');
SELECT cron.schedule(
  'capture-slow-queries', '*/15 * * * *',
  $cron$ SELECT public.capture_slow_queries(500); $cron$
);

-- 2. cleanup-cron-logs — domingo 05:00
SELECT pg_temp.safe_unschedule('cleanup-cron-logs');
SELECT cron.schedule(
  'cleanup-cron-logs', '0 5 * * 0',
  $cron$ SELECT public.cleanup_old_cron_logs(); $cron$
);

-- 3. cleanup-expired-tokens — a cada 6h
SELECT pg_temp.safe_unschedule('cleanup-expired-tokens');
SELECT cron.schedule(
  'cleanup-expired-tokens', '0 */6 * * *',
  $cron$ SELECT public.cleanup_expired_tokens(); $cron$
);

-- 4. cleanup-login-attempts — diário 04:00
SELECT pg_temp.safe_unschedule('cleanup-login-attempts');
SELECT cron.schedule(
  'cleanup-login-attempts', '0 4 * * *',
  $cron$ SELECT public.cleanup_old_login_attempts(); $cron$
);

-- 5. daily-log-retention — diário 03:00
SELECT pg_temp.safe_unschedule('daily-log-retention');
SELECT cron.schedule(
  'daily-log-retention', '0 3 * * *',
  $cron$ SELECT public.cleanup_log_tables(); $cron$
);

-- 6. detect-query-regressions-5min — a cada 5 min
SELECT pg_temp.safe_unschedule('detect-query-regressions-5min');
SELECT cron.schedule(
  'detect-query-regressions-5min', '*/5 * * * *',
  $cron$ SELECT public.detect_query_regressions(); $cron$
);

-- 7. evaluate-delivery-alerts-every-min — a cada 1 min (HTTP → Edge Function)
SELECT pg_temp.safe_unschedule('evaluate-delivery-alerts-every-min');
SELECT cron.schedule(
  'evaluate-delivery-alerts-every-min', '* * * * *',
  $cron$
  SELECT net.http_post(
    url    := 'https://${PROJECT_REF}.supabase.co/functions/v1/evaluate-delivery-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey',       '${ANON_KEY}',
      'Authorization', 'Bearer ${ANON_KEY}'
    ),
    body    := jsonb_build_object('time', now())
  ) AS request_id;
  $cron$
);

-- 8. maintain-monthly-partitions — dia 1 do mês 02:00
SELECT pg_temp.safe_unschedule('maintain-monthly-partitions');
SELECT cron.schedule(
  'maintain-monthly-partitions', '0 2 1 * *',
  $cron$ SELECT public.maintain_monthly_partitions(); $cron$
);

-- 9. monitor-table-bloat-daily — diário 03:15
SELECT pg_temp.safe_unschedule('monitor-table-bloat-daily');
SELECT cron.schedule(
  'monitor-table-bloat-daily', '15 3 * * *',
  $cron$ SELECT public.monitor_table_bloat(); $cron$
);

-- 10. monthly-partition-maint — dia 1 do mês 02:00 (redundância intencional com #8)
SELECT pg_temp.safe_unschedule('monthly-partition-maint');
SELECT cron.schedule(
  'monthly-partition-maint', '0 2 1 * *',
  $cron$ SELECT public.maintain_monthly_partitions(); $cron$
);

-- 11. pgss_baseline_cleanup — dia 1 do mês 04:00
SELECT pg_temp.safe_unschedule('pgss_baseline_cleanup');
SELECT cron.schedule(
  'pgss_baseline_cleanup', '0 4 1 * *',
  $cron$ SELECT public.cleanup_pgss_baseline(90); $cron$
);

-- 12. pgss_weekly_baseline — domingo 03:00
SELECT pg_temp.safe_unschedule('pgss_weekly_baseline');
SELECT cron.schedule(
  'pgss_weekly_baseline', '0 3 * * 0',
  $cron$ SELECT public.capture_pg_stat_statements_baseline('weekly_auto_' || to_char(now(),'YYYY_MM_DD')); $cron$
);

-- 13. refresh-performance-alerts-weekly — diário 03:45
SELECT pg_temp.safe_unschedule('refresh-performance-alerts-weekly');
SELECT cron.schedule(
  'refresh-performance-alerts-weekly', '45 3 * * *',
  $cron$ SELECT public.refresh_performance_alerts_weekly(); $cron$
);

-- 14. snapshot-table-bloat-daily — diário 03:10
SELECT pg_temp.safe_unschedule('snapshot-table-bloat-daily');
SELECT cron.schedule(
  'snapshot-table-bloat-daily', '10 3 * * *',
  $cron$ SELECT public.snapshot_table_bloat(); $cron$
);

COMMIT;

-- Validação inline
DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM cron.job
   WHERE jobname IN (
     'capture-slow-queries','cleanup-cron-logs','cleanup-expired-tokens',
     'cleanup-login-attempts','daily-log-retention','detect-query-regressions-5min',
     'evaluate-delivery-alerts-every-min','maintain-monthly-partitions',
     'monitor-table-bloat-daily','monthly-partition-maint','pgss_baseline_cleanup',
     'pgss_weekly_baseline','refresh-performance-alerts-weekly','snapshot-table-bloat-daily'
   );
  IF v_count <> 14 THEN
    RAISE EXCEPTION 'Esperado 14 jobs registrados, encontrado %', v_count;
  END IF;
  RAISE NOTICE '✅ 14 cron jobs registrados com sucesso.';
END $$;
