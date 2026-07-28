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

  -- E1: pedido COMPLETED sem actual_delivery
  -- (comparação tipada: se o rótulo do enum sumir, a função falha alto em vez de silenciar)
  WITH q AS (
    SELECT id FROM public.lalamove_orders
    WHERE status = 'COMPLETED'::order_status AND actual_delivery IS NULL
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'entrega','order_completed_sem_timestamp',
    CASE WHEN c >= 10 THEN 'critical' WHEN c >= 1 THEN 'warning' ELSE 'info' END,
    v_hour, c, format('%s pedidos com status=COMPLETED sem actual_delivery', c),
    COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- E2: active_tracking ACTIVE em order já finalizada
  WITH q AS (
    SELECT at.order_id AS id
    FROM public.active_tracking at
    JOIN public.lalamove_orders o ON o.id = at.order_id
    WHERE at.tracking_status = 'ACTIVE'
      AND o.status = ANY (ARRAY['COMPLETED','CANCELLED','REJECTED','EXPIRED']::order_status[])
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'entrega','tracking_ativo_em_order_finalizada',
    CASE WHEN c >= 5 THEN 'critical' WHEN c >= 1 THEN 'warning' ELSE 'info' END,
    v_hour, c, format('%s trackings ACTIVE em pedidos finalizados', c),
    COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- E3: order com driver_id órfão
  WITH q AS (
    SELECT o.id
    FROM public.lalamove_orders o
    LEFT JOIN public.drivers d ON d.id = o.driver_id
    WHERE o.driver_id IS NOT NULL AND d.id IS NULL
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'entrega','order_com_driver_inexistente','critical', v_hour, c,
    format('%s pedidos referenciam driver inexistente', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- S1: aprovação decidida sem reviewed_at
  WITH q AS (
    SELECT id FROM public.driver_approval_queue
    WHERE status = ANY (ARRAY['APPROVED','REJECTED']::approval_status[]) AND reviewed_at IS NULL
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'screening','aprovacao_decidida_sem_reviewed_at','warning', v_hour, c,
    format('%s aprovações decididas sem timestamp de revisão', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- S2: whitelist e blacklist simultâneos
  WITH q AS (
    SELECT id FROM public.drivers
    WHERE whitelisted = true AND blacklisted = true
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'screening','driver_whitelist_e_blacklist','critical', v_hour, c,
    format('%s motoristas em whitelist E blacklist simultaneamente', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- S3: APPROVED com driver bloqueado (rótulos reais: BLOCKED / BLACKLIST)
  WITH q AS (
    SELECT q.id
    FROM public.driver_approval_queue q
    JOIN public.drivers d ON d.id = q.driver_id
    WHERE q.status = 'APPROVED'::approval_status
      AND (d.blacklisted = true OR d.status = ANY (ARRAY['BLOCKED','BLACKLIST']::driver_status[]))
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'screening','aprovacao_conflita_com_driver_status','critical', v_hour, c,
    format('%s aprovações APPROVED com driver bloqueado/blacklist', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- F1
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
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- F2
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
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- F3
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
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- F4
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
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

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
$function$;