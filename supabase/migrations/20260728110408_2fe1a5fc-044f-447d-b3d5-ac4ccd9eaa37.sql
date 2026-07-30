DO $$
DECLARE
  t text;
  alvos text[] := ARRAY[
    'public.audit_logs_default','public.frontend_error_logs_default',
    'public.auth_logs','public.frontend_performance_logs','public.runtime_error_logs',
    'public.query_telemetry','public.rate_limit_logs','public.sso_login_attempts',
    'public.cron_job_logs','public.webhooks_log','public.bitrix_sync_logs',
    'public.bitrix_webhook_events','public.n8n_dispatch_logs','public.digest_envios_log',
    'public.alerts_sent','public.slow_query_alerts','public.pg_stat_statements_baseline',
    'public.bloat_snapshots','public.login_attempts','public.active_tracking',
    'public.driver_locations','public.tracking_events','public.rpc_observability_metrics'
  ];
BEGIN
  FOREACH t IN ARRAY alvos LOOP
    IF to_regclass(t) IS NOT NULL THEN
      EXECUTE format(
        'ALTER TABLE %s SET ('
        || 'autovacuum_vacuum_scale_factor = 0.02, '
        || 'autovacuum_analyze_scale_factor = 0.02, '
        || 'autovacuum_vacuum_threshold = 200, '
        || 'autovacuum_analyze_threshold = 200, '
        || 'autovacuum_vacuum_cost_delay = 2)', t);
    END IF;
  END LOOP;
END $$;