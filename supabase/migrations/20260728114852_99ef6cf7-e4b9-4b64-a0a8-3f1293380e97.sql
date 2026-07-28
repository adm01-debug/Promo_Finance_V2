-- Índices para purga eficiente de alertas encerrados
CREATE INDEX IF NOT EXISTS idx_integrity_alerts_resolved_created
  ON public.integrity_alerts (created_at)
  WHERE resolved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_perf_alerts_resolved_created
  ON public.performance_alerts (created_at)
  WHERE resolved_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.cleanup_log_tables()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_start TIMESTAMPTZ := now();
  v_result JSONB := '{}'::jsonb;
  v_log_id UUID;
  v_rec RECORD;
  v_deleted BIGINT;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('cleanup_log_tables')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  INSERT INTO public.cron_job_logs (job_name, executed_at)
  VALUES ('daily-log-retention', v_start)
  RETURNING id INTO v_log_id;

  FOR v_rec IN
    SELECT * FROM (VALUES
      ('public.audit_logs_default',          'created_at', 180, NULL::text),
      ('public.frontend_error_logs_default', 'created_at',  30, NULL),
      ('public.auth_logs',                   'created_at',  90, NULL),
      ('public.frontend_performance_logs',   'created_at',  14, NULL),
      ('public.runtime_error_logs',          'created_at',  30, NULL),
      ('public.query_telemetry',             'created_at',  30, NULL),
      ('public.rate_limit_logs',             'created_at',  30, NULL),
      ('public.sso_login_attempts',          'created_at',  90, NULL),
      ('public.cron_job_logs',               'created_at',  30, NULL),
      ('public.webhooks_log',                'created_at',  60, 'status NOT IN (''dead'',''retrying'')'),
      ('public.bitrix_sync_logs',            'created_at',  60, NULL),
      ('public.bitrix_webhook_events',       'created_at',  30, NULL),
      ('public.n8n_dispatch_logs',           'created_at',  60, NULL),
      ('public.digest_envios_log',           'created_at',  90, NULL),
      ('public.alerts_sent',                 'created_at',  90, NULL),
      ('public.historico_cobranca_whatsapp', 'created_at', 365, NULL),
      ('public.slow_query_alerts',           'created_at',  60, NULL),
      ('public.pg_stat_statements_baseline', 'created_at',  30, NULL),
      ('public.bloat_snapshots',             'created_at',  90, NULL),
      ('public.anomalia_detection_runs',     'created_at',  90, NULL),
      ('public.logs_baixa_automatica',       'created_at', 180, NULL),
      ('public.logs_conciliacao_retroativa', 'created_at', 180, NULL),
      ('public.ci_security_gate_events',     'created_at', 180, NULL),
      -- alertas: SOMENTE os já encerrados são purgados; abertos nunca são removidos
      ('public.integrity_alerts',            'created_at',  90, 'resolved_at IS NOT NULL'),
      ('public.performance_alerts',          'created_at',  90, 'resolved_at IS NOT NULL'),
      ('public.security_audit_logs',         'created_at', 1825, NULL),
      ('public.user_action_audit',           'created_at', 1825, NULL),
      ('public.auditoria_financeira',        'created_at', 1825, NULL),
      ('public.asaas_audit_trail',           'created_at', 1825, NULL)
    ) AS t(tabela, coluna, dias, filtro)
  LOOP
    IF to_regclass(v_rec.tabela) IS NULL THEN
      CONTINUE;
    END IF;
    v_deleted := public.purge_old_rows(
      v_rec.tabela::regclass, v_rec.coluna, v_rec.dias, v_rec.filtro
    );
    IF v_deleted > 0 THEN
      v_result := v_result || jsonb_build_object(split_part(v_rec.tabela, '.', 2), v_deleted);
    END IF;
  END LOOP;

  v_result := v_result || jsonb_build_object(
    'partitions', public.maintain_monthly_partitions()
  );

  v_result := v_result || jsonb_build_object(
    'duration_ms', (EXTRACT(EPOCH FROM (now() - v_start)) * 1000)::integer,
    'success', true
  );

  UPDATE public.cron_job_logs
     SET completed_at = now(),
         duration_ms = (v_result->>'duration_ms')::integer,
         result = v_result,
         success = true
   WHERE id = v_log_id;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
     SET completed_at = now(),
         success = false,
         error_message = SQLERRM
   WHERE id = v_log_id;
  RAISE;
END;
$function$;