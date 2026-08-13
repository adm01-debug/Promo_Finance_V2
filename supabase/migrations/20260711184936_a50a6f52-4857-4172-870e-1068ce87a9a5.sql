-- Item 23: Autovacuum tuning para tabelas write-heavy (apenas relkind='r')
DO $$
DECLARE
  t text;
  log_tables text[] := ARRAY[
    'audit_logs',
    'frontend_error_logs',
    'auth_logs',
    'runtime_error_logs',
    'query_telemetry',
    'rate_limit_logs',
    'webhooks_log',
    'cron_job_logs',
    'login_attempts',
    'sso_login_attempts',
    'slow_query_alerts',
    'historico_cobranca',
    'frontend_performance_logs',
    'security_audit_logs',
    'user_action_audit'
  ];
BEGIN
  FOREACH t IN ARRAY log_tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      EXECUTE format($f$
        ALTER TABLE public.%I SET (
          autovacuum_vacuum_scale_factor = 0.02,
          autovacuum_analyze_scale_factor = 0.01,
          autovacuum_vacuum_cost_delay = 10,
          autovacuum_vacuum_cost_limit = 1000,
          autovacuum_vacuum_threshold = 500,
          autovacuum_analyze_threshold = 250
        )
      $f$, t);
    END IF;
  END LOOP;

  -- Partições-folha de audit_logs e frontend_error_logs
  FOR t IN
    SELECT c.relname
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND p.relname IN ('audit_logs', 'frontend_error_logs')
  LOOP
    EXECUTE format($f$
      ALTER TABLE public.%I SET (
        autovacuum_vacuum_scale_factor = 0.02,
        autovacuum_analyze_scale_factor = 0.01,
        autovacuum_vacuum_cost_delay = 10,
        autovacuum_vacuum_cost_limit = 1000,
        autovacuum_vacuum_threshold = 500,
        autovacuum_analyze_threshold = 250
      )
    $f$, t);
  END LOOP;
END $$;

ANALYZE public.webhooks_log;
ANALYZE public.query_telemetry;
ANALYZE public.login_attempts;
ANALYZE public.auth_logs;
ANALYZE public.runtime_error_logs;