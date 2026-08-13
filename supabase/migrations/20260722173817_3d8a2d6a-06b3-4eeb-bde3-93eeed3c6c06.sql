CREATE TABLE IF NOT EXISTS public.integrity_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL CHECK (domain IN ('entrega', 'screening', 'financeiro')),
  invariant TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  alert_hour TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
  affected_count BIGINT NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  sample_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (domain, invariant, alert_hour)
);

CREATE INDEX IF NOT EXISTS idx_integrity_alerts_open
  ON public.integrity_alerts (created_at DESC)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_integrity_alerts_domain
  ON public.integrity_alerts (domain, severity, created_at DESC);

GRANT SELECT ON public.integrity_alerts TO authenticated;
GRANT ALL ON public.integrity_alerts TO service_role;

ALTER TABLE public.integrity_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integrity_alerts_admin_read" ON public.integrity_alerts;
CREATE POLICY "integrity_alerts_admin_read"
  ON public.integrity_alerts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "integrity_alerts_service_all" ON public.integrity_alerts;
CREATE POLICY "integrity_alerts_service_all"
  ON public.integrity_alerts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_integrity_alerts_updated_at ON public.integrity_alerts;
CREATE TRIGGER trg_integrity_alerts_updated_at
  BEFORE UPDATE ON public.integrity_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.check_integrity_invariants()
RETURNS JSONB
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

  -- E1: order status DELIVERED sem actual_delivery
  WITH q AS (
    SELECT id FROM public.lalamove_orders
    WHERE status::text = 'DELIVERED' AND actual_delivery IS NULL
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'entrega','order_delivered_sem_timestamp',
    CASE WHEN c >= 10 THEN 'critical' WHEN c >= 1 THEN 'warning' ELSE 'info' END,
    v_hour, c, format('%s pedidos com status=DELIVERED sem actual_delivery', c),
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
      AND o.status::text IN ('DELIVERED','CANCELED','COMPLETED','REJECTED','EXPIRED')
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

  -- E3: order com driver_id órfão (defesa em profundidade)
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
    WHERE status::text IN ('APPROVED','REJECTED') AND reviewed_at IS NULL
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

  -- S3: APPROVED com driver bloqueado
  WITH q AS (
    SELECT q.id
    FROM public.driver_approval_queue q
    JOIN public.drivers d ON d.id = q.driver_id
    WHERE q.status::text = 'APPROVED'
      AND (d.blacklisted = true OR d.status::text IN ('BLACKLISTED','SUSPENDED','REJECTED'))
    LIMIT 500
  ), ct AS (SELECT COUNT(*) c, array_agg(id) ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'screening','aprovacao_conflita_com_driver_status','critical', v_hour, c,
    format('%s aprovações APPROVED com driver bloqueado/suspenso', c), COALESCE(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

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
    SET affected_count = EXCLUDED.affected_count, reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  -- F2: contas_pagar pago sem data ou valor
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

  -- F3: conciliacoes confirmadas vazias
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

  -- F4: status='conciliado' com conciliada=false
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

  -- Resumo
  SELECT COUNT(*), COUNT(*) FILTER (WHERE severity = 'critical')
    INTO v_total, v_critical
  FROM public.integrity_alerts
  WHERE alert_hour = v_hour;

  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  VALUES (
    'integrity_check', 'integrity_alerts',
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start))::integer,
    CASE WHEN v_critical > 0 THEN 'critical' WHEN v_total > 0 THEN 'warning' ELSE 'info' END,
    format('alerts=%s critical=%s', v_total, v_critical), now()
  );

  RETURN jsonb_build_object(
    'success', true, 'total_alerts', v_total, 'critical_alerts', v_critical,
    'alert_hour', v_hour,
    'duration_ms', EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start))::integer
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.check_integrity_invariants() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_integrity_invariants() TO service_role;

CREATE OR REPLACE FUNCTION public.get_integrity_alerts(
  p_hours INTEGER DEFAULT 24,
  p_only_open BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID, domain TEXT, invariant TEXT, severity TEXT,
  affected_count BIGINT, reason TEXT, sample_ids UUID[],
  alert_hour TIMESTAMPTZ, resolved_at TIMESTAMPTZ, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores.';
  END IF;

  RETURN QUERY
  SELECT a.id, a.domain, a.invariant, a.severity, a.affected_count,
         a.reason, a.sample_ids, a.alert_hour, a.resolved_at, a.created_at
  FROM public.integrity_alerts a
  WHERE a.created_at > now() - make_interval(hours => GREATEST(p_hours, 1))
    AND (NOT p_only_open OR a.resolved_at IS NULL)
  ORDER BY
    CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
    a.created_at DESC
  LIMIT 500;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_integrity_alerts(INTEGER, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_integrity_alerts(INTEGER, BOOLEAN) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'integrity-invariants-hourly') THEN
      PERFORM cron.unschedule('integrity-invariants-hourly');
    END IF;
    PERFORM cron.schedule(
      'integrity-invariants-hourly',
      '5 * * * *',
      'SELECT public.check_integrity_invariants();'
    );
  END IF;
END $$;