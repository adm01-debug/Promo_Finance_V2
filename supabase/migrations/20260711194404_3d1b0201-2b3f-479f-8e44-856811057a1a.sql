
-- Item 27 (retry): storage params só em tabelas não-particionadas + partições filhas
DO $$
DECLARE
  v_table text;
  v_targets text[] := ARRAY[
    'frontend_performance_logs',
    'auth_logs',
    'runtime_error_logs',
    'query_telemetry',
    'rate_limit_logs',
    'webhooks_log',
    'cron_job_logs',
    'slow_query_alerts',
    'login_attempts',
    'sso_login_attempts',
    'security_audit_logs',
    'logs_baixa_automatica',
    'historico_cobranca'
  ];
  v_exists boolean;
  v_is_partitioned boolean;
BEGIN
  FOREACH v_table IN ARRAY v_targets LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_table
    ) INTO v_exists;

    IF NOT v_exists THEN CONTINUE; END IF;

    SELECT c.relkind = 'p' INTO v_is_partitioned
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_table;

    IF v_is_partitioned THEN CONTINUE; END IF;

    EXECUTE format($f$
      ALTER TABLE public.%I SET (
        autovacuum_vacuum_scale_factor = 0.05,
        autovacuum_analyze_scale_factor = 0.02,
        autovacuum_vacuum_threshold = 1000,
        autovacuum_analyze_threshold = 500,
        autovacuum_vacuum_cost_limit = 2000,
        autovacuum_vacuum_cost_delay = 10
      )
    $f$, v_table);
  END LOOP;

  -- Partições filhas de audit_logs / frontend_error_logs
  FOR v_table IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_inherits i ON i.inhrelid = c.oid
    JOIN pg_class parent ON parent.oid = i.inhparent
    WHERE n.nspname = 'public'
      AND parent.relname IN ('audit_logs','frontend_error_logs')
      AND c.relkind = 'r'
  LOOP
    EXECUTE format($f$
      ALTER TABLE public.%I SET (
        autovacuum_vacuum_scale_factor = 0.05,
        autovacuum_analyze_scale_factor = 0.02,
        autovacuum_vacuum_threshold = 1000,
        autovacuum_analyze_threshold = 500,
        autovacuum_vacuum_cost_limit = 2000,
        autovacuum_vacuum_cost_delay = 10
      )
    $f$, v_table);
  END LOOP;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['webhooks_log','query_telemetry','runtime_error_logs','auth_logs','login_attempts'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ANALYZE public.%I', t);
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
    INSERT INTO public.audit_logs (action, table_name, details)
    VALUES (
      'autovacuum_tuning_applied',
      'log_tables_and_partitions',
      'Item 27: autovacuum ajustado em tabelas simples de log + partições filhas de audit_logs/frontend_error_logs'
    );
  END IF;
END $$;
