-- Restaura o monitor de integridade removido indevidamente no descomissionamento
-- de Lalamove. Esta versão cobre apenas invariantes financeiros ainda canônicos.
-- Pré-condições: integrity_alerts, query_telemetry e as quatro tabelas financeiras
-- devem existir; a reconciliação deve ser ensaiada em staging antes de produção.

CREATE OR REPLACE FUNCTION public.check_integrity_invariants()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_start timestamptz := clock_timestamp();
  v_hour timestamptz := date_trunc('hour', now());
  v_total integer := 0;
  v_critical integer := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('check_integrity_invariants')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  WITH q AS (
    SELECT id FROM public.contas_receber
    WHERE status IN ('recebido', 'pago')
      AND valor_recebido IS NULL
      AND deleted_at IS NULL
    LIMIT 500
  ), ct AS (SELECT count(*) AS c, array_agg(id) AS ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'financeiro', 'receber_recebido_sem_valor', 'warning', v_hour, c,
    format('%s contas a receber marcadas como recebidas sem valor_recebido', c),
    coalesce(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  WITH q AS (
    SELECT id FROM public.contas_pagar
    WHERE status = 'pago'
      AND (data_pagamento IS NULL OR valor_pago IS NULL)
      AND deleted_at IS NULL
    LIMIT 500
  ), ct AS (SELECT count(*) AS c, array_agg(id) AS ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'financeiro', 'pagar_pago_sem_data_ou_valor', 'warning', v_hour, c,
    format('%s contas a pagar pagas sem data_pagamento ou valor_pago', c),
    coalesce(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  WITH q AS (
    SELECT id FROM public.conciliacoes
    WHERE status = 'confirmado' AND coalesce(total_conciliados, 0) = 0
    LIMIT 500
  ), ct AS (SELECT count(*) AS c, array_agg(id) AS ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'financeiro', 'conciliacao_confirmada_vazia', 'warning', v_hour, c,
    format('%s conciliações confirmadas sem itens', c), coalesce(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  WITH q AS (
    SELECT id FROM public.transacoes_bancarias
    WHERE status = 'conciliado' AND conciliada = false AND deleted_at IS NULL
    LIMIT 500
  ), ct AS (SELECT count(*) AS c, array_agg(id) AS ids FROM q)
  INSERT INTO public.integrity_alerts (domain, invariant, severity, alert_hour, affected_count, reason, sample_ids)
  SELECT 'financeiro', 'transacao_status_flag_dessincronizados', 'critical', v_hour, c,
    format('%s transações com status=conciliado mas conciliada=false', c),
    coalesce(ids[1:20], '{}')
  FROM ct WHERE c > 0
  ON CONFLICT (domain, invariant, alert_hour) DO UPDATE
    SET affected_count = EXCLUDED.affected_count, severity = EXCLUDED.severity,
        reason = EXCLUDED.reason, sample_ids = EXCLUDED.sample_ids;

  SELECT count(*), count(*) FILTER (WHERE severity = 'critical')
    INTO v_total, v_critical
  FROM public.integrity_alerts
  WHERE alert_hour = v_hour AND domain = 'financeiro';

  INSERT INTO public.query_telemetry (operation, table_name, duration_ms, severity, error_message, created_at)
  VALUES (
    'integrity_check', 'integrity_alerts',
    (extract(epoch FROM clock_timestamp() - v_start) * 1000)::integer,
    CASE WHEN v_critical > 0 THEN 'critical' WHEN v_total > 0 THEN 'warning' ELSE 'info' END,
    format('alerts=%s critical=%s', v_total, v_critical), now()
  );

  RETURN jsonb_build_object(
    'success', true, 'total_alerts', v_total, 'critical_alerts', v_critical,
    'alert_hour', v_hour,
    'duration_ms', (extract(epoch FROM clock_timestamp() - v_start) * 1000)::integer
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.check_integrity_invariants() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_integrity_invariants() TO service_role;
