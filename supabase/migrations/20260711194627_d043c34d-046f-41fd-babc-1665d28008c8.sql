
-- Item 28: BRIN indexes em created_at de tabelas append-only de log.
-- BRIN é ~1000x menor que B-tree e ideal para dados naturalmente ordenados por tempo.

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
    'sso_login_attempts',
    'security_audit_logs',
    'logs_baixa_automatica',
    'historico_cobranca',
    'webhook_dlq',
    'webhook_events',
    'bitrix_sync_logs',
    'logs_conciliacao_retroativa'
  ];
  v_idx text;
  v_exists boolean;
  v_has_col boolean;
BEGIN
  FOREACH v_table IN ARRAY v_targets LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=v_table AND column_name='created_at'
    ) INTO v_has_col;

    IF NOT v_has_col THEN CONTINUE; END IF;

    v_idx := 'brin_' || v_table || '_created_at';
    IF length(v_idx) > 63 THEN
      v_idx := 'brin_' || substr(md5(v_table),1,20) || '_ca';
    END IF;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I USING BRIN (created_at) WITH (pages_per_range = 32)',
      v_idx, v_table
    );
  END LOOP;

  -- Partições filhas de audit_logs / frontend_error_logs → BRIN por partição
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
    v_idx := 'brin_' || v_table || '_ca';
    IF length(v_idx) > 63 THEN
      v_idx := 'brin_' || substr(md5(v_table),1,20) || '_ca';
    END IF;
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I USING BRIN (created_at) WITH (pages_per_range = 32)',
      v_idx, v_table
    );
  END LOOP;
END $$;

INSERT INTO public.audit_logs (action, table_name, details)
VALUES (
  'brin_indexes_created',
  'log_tables_append_only',
  'Item 28: BRIN indexes em created_at de tabelas de log + partições (pages_per_range=32)'
);
