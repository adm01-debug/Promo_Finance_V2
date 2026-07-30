-- Purga em lotes, evitando locks longos em tabelas grandes
CREATE OR REPLACE FUNCTION public.purge_old_rows(
  p_table   regclass,
  p_column  text,
  p_days    integer,
  p_where   text DEFAULT NULL,
  p_batch   integer DEFAULT 10000,
  p_max_batches integer DEFAULT 50
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_total bigint := 0;
  v_count bigint;
  v_i integer := 0;
  v_sql text;
BEGIN
  IF p_days IS NULL OR p_days < 1 THEN
    RAISE EXCEPTION 'purge_old_rows: p_days deve ser >= 1 (recebido %)', p_days;
  END IF;
  IF p_batch < 1 OR p_batch > 100000 THEN
    RAISE EXCEPTION 'purge_old_rows: p_batch fora da faixa permitida (1..100000)';
  END IF;

  -- valida que a coluna existe e é temporal (evita injeção via p_column)
  PERFORM 1
    FROM pg_attribute a
    JOIN pg_type t ON t.oid = a.atttypid
   WHERE a.attrelid = p_table
     AND a.attname = p_column
     AND a.attnum > 0
     AND NOT a.attisdropped
     AND t.typname IN ('timestamptz','timestamp','date');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'purge_old_rows: coluna temporal % inexistente em %', p_column, p_table::text;
  END IF;

  v_sql := format(
    'DELETE FROM %s WHERE ctid IN (SELECT ctid FROM %s WHERE %I < now() - ($1 || '' days'')::interval %s LIMIT %s)',
    p_table::text, p_table::text, p_column,
    CASE WHEN p_where IS NULL OR btrim(p_where) = '' THEN '' ELSE 'AND (' || p_where || ')' END,
    p_batch
  );

  LOOP
    v_i := v_i + 1;
    EXECUTE v_sql USING p_days;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    EXIT WHEN v_count < p_batch OR v_i >= p_max_batches;
  END LOOP;

  RETURN v_total;
END;
$function$;

REVOKE ALL ON FUNCTION public.purge_old_rows(regclass, text, integer, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_rows(regclass, text, integer, text, integer, integer) TO service_role;

-- Limpeza diária dirigida por política de retenção
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

  -- audit_logs / frontend_error_logs são particionadas: retenção via drop_old_partitions().
  -- Aqui apenas as partições DEFAULT (linhas fora de faixa) são higienizadas.
  FOR v_rec IN
    SELECT * FROM (VALUES
      ('public.audit_logs_default',          'created_at', 180, NULL::text),
      ('public.frontend_error_logs_default', 'created_at',  30, NULL),
      -- logs operacionais
      ('public.auth_logs',                   'created_at',  90, NULL),
      ('public.frontend_performance_logs',   'created_at',  14, NULL),
      ('public.runtime_error_logs',          'created_at',  30, NULL),
      ('public.query_telemetry',             'created_at',  30, NULL),
      ('public.rate_limit_logs',             'created_at',  30, NULL),
      ('public.sso_login_attempts',          'created_at',  90, NULL),
      ('public.cron_job_logs',               'created_at',  30, NULL),
      ('public.webhooks_log',                'created_at',  60, 'status NOT IN (''dead'',''retrying'')'),
      -- integrações e automações
      ('public.bitrix_sync_logs',            'created_at',  60, NULL),
      ('public.bitrix_webhook_events',       'created_at',  30, NULL),
      ('public.n8n_dispatch_logs',           'created_at',  60, NULL),
      ('public.digest_envios_log',           'created_at',  90, NULL),
      ('public.alerts_sent',                 'created_at',  90, NULL),
      ('public.historico_cobranca_whatsapp', 'created_at', 365, NULL),
      -- diagnóstico / observabilidade
      ('public.slow_query_alerts',           'created_at',  60, NULL),
      ('public.pg_stat_statements_baseline', 'created_at',  30, NULL),
      ('public.bloat_snapshots',             'created_at',  90, NULL),
      ('public.anomalia_detection_runs',     'created_at',  90, NULL),
      ('public.logs_baixa_automatica',       'created_at', 180, NULL),
      ('public.logs_conciliacao_retroativa', 'created_at', 180, NULL),
      ('public.ci_security_gate_events',     'created_at', 180, NULL),
      -- trilhas de auditoria: retenção longa (5 anos)
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
    'duration_ms', EXTRACT(MILLISECONDS FROM (now() - v_start))::integer,
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

REVOKE ALL ON FUNCTION public.cleanup_log_tables() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_log_tables() TO service_role;