-- =====================================================================
-- ITEM 36 (v2) — Autovacuum tuning; expande partições folha
-- =====================================================================
DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'audit_logs',
    'auth_logs',
    'frontend_error_logs',
    'frontend_performance_logs',
    'runtime_error_logs',
    'query_telemetry',
    'rate_limit_logs',
    'webhooks_log',
    'webhook_dlq',
    'cron_job_logs',
    'sso_login_attempts',
    'slow_query_alerts',
    'login_attempts',
    'historico_cobranca',
    'logs_baixa_automatica'
  ];
  v_table TEXT;
  v_relkind CHAR;
  v_target_oid OID;
  v_target RECORD;
  v_applied INT := 0;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT c.oid, c.relkind INTO v_target_oid, v_relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_table;

    IF v_target_oid IS NULL THEN
      RAISE NOTICE 'Skipped (not found): public.%', v_table;
      CONTINUE;
    END IF;

    IF v_relkind = 'p' THEN
      -- Particionada: aplica em cada partição folha (regular tables)
      FOR v_target IN
        SELECT n.nspname AS schema_name, c.relname AS table_name
        FROM pg_inherits i
        JOIN pg_class c ON c.oid = i.inhrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE i.inhparent = v_target_oid AND c.relkind = 'r'
      LOOP
        EXECUTE format($f$
          ALTER TABLE %I.%I SET (
            autovacuum_vacuum_scale_factor = 0.05,
            autovacuum_analyze_scale_factor = 0.02,
            autovacuum_vacuum_threshold = 1000,
            autovacuum_analyze_threshold = 500,
            autovacuum_vacuum_cost_limit = 2000,
            autovacuum_vacuum_cost_delay = 10
          )
        $f$, v_target.schema_name, v_target.table_name);
        v_applied := v_applied + 1;
      END LOOP;
      RAISE NOTICE 'Autovacuum tuned on partitions of public.%', v_table;
    ELSIF v_relkind = 'r' THEN
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
      v_applied := v_applied + 1;
      RAISE NOTICE 'Autovacuum tuned: public.%', v_table;
    END IF;
  END LOOP;

  INSERT INTO public.audit_logs (
    table_name, record_id, action, details, user_id, user_email, created_at
  ) VALUES (
    '_meta_hardening', gen_random_uuid(), 'ITEM_36',
    'Autovacuum aggressive tuning applied to ' || v_applied || ' relations (leaf partitions expanded)',
    NULL, 'system', now()
  );
END $$;
