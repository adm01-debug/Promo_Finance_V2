CREATE OR REPLACE FUNCTION public.check_integrity_invariants()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_hour TIMESTAMPTZ := date_trunc('hour', now());
  v_total INTEGER := 0;
  v_critical INTEGER := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('check_integrity_invariants')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  -- E1-E3: blocos entrega/lalamove decommissionados (tabelas removidas em 2026-08-25)
  -- E1: lalamove_orders COMPLETED sem actual_delivery — SKIP (tabela removida)
  -- E2: active_tracking em order finalizada — SKIP (tabela removida)
  -- E3: lalamove_orders com driver_id órfão — SKIP (tabela removida)

  -- S1-S4: blocos screening/driver decommissionados (tabelas removidas em 2026-08-25)
  -- S1: driver_approval_queue aprovação sem reviewed_at — SKIP
  -- S2: drivers whitelist+blacklist simultâneos — SKIP
  -- S3: aprovação conflita driver status — SKIP

  -- F1: contas_receber recebido sem valor_recebido
  WITH q AS (
    SELECT id FROM public.contas_receber
    WHERE status IN ('recebido','pago') AND valor_recebido IS NULL AND deleted_at IS NULL
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'financeiro','receber_recebido_sem_valor','warning', v_hour, c,
    format('%s contas a receber marcadas como recebidas sem valor_recebido', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- F2: contas_pagar pago sem data_pagamento ou valor_pago
  WITH q AS (
    SELECT id FROM public.contas_pagar
    WHERE status = 'pago' AND (data_pagamento IS NULL OR valor_pago IS NULL)
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'financeiro','pagar_pago_sem_data_ou_valor','warning', v_hour, c,
    format('%s contas a pagar pagas sem data_pagamento ou valor_pago', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- F3: conciliações confirmadas vazias
  WITH q AS (
    SELECT id FROM public.conciliacoes
    WHERE status = 'confirmado' AND COALESCE(total_conciliados, 0) = 0
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'financeiro','conciliacao_confirmada_vazia','warning', v_hour, c,
    format('%s conciliações confirmadas sem itens', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- F4: transacoes_bancarias status/flag dessincronizados
  WITH q AS (
    SELECT id FROM public.transacoes_bancarias
    WHERE status = 'conciliado' AND conciliada = false
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'financeiro','transacao_status_flag_dessincronizados','critical', v_hour, c,
    format('%s transações com status=conciliado mas conciliada=false', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE severity = 'critical')
    INTO v_total, v_critical
  FROM public.integrity_alerts
  WHERE alert_hour = v_hour;

  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  VALUES (
    'integrity_check', 'integrity_alerts',
    (EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::integer,
    CASE WHEN v_critical > 0 THEN 'critical' WHEN v_total > 0 THEN 'warning' ELSE 'info' END,
    format('alerts=%s critical=%s', v_total, v_critical), now()
  );

  RETURN jsonb_build_object(
    'success', true, 'total_alerts', v_total, 'critical_alerts', v_critical,
    'alert_hour', v_hour,
    'duration_ms', (EXTRACT(EPOCH FROM (clock_timestamp() - v_start)) * 1000)::integer
  );
END;
$function$
