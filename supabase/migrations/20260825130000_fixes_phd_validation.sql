-- ==================================================================
-- 20260825130000_fixes_phd_validation.sql
-- Fixes adicionais detectados pela suite PhD-level 5 agentes
-- ==================================================================

-- F1: Re-grant anon EXECUTE nas 2 funções pré-login
-- (2ª passada de REVOKE EXECUTE removeu esses grants indevidamente)
GRANT EXECUTE ON FUNCTION public.gerar_numero_acordo() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_sso_providers_for_domain(text) TO anon, authenticated;

-- F2: Drop stub get_cron_run_history (overload sem args com body=36 chars)
DO $$
DECLARE v_oid oid;
BEGIN
  SELECT oid INTO v_oid FROM pg_proc
  WHERE proname='get_cron_run_history' AND pronamespace='public'::regnamespace
    AND length(prosrc)<50;
  IF v_oid IS NOT NULL THEN
    EXECUTE 'DROP FUNCTION IF EXISTS public.get_cron_run_history('
      || pg_get_function_identity_arguments(v_oid) || ') CASCADE';
  END IF;
END $$;

-- F3: partidas_contabeis.empresa_id (ainda ausente após primeiro fix)
ALTER TABLE public.partidas_contabeis ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- F4: notas_fiscais — DELETE policy ausente
DROP POLICY IF EXISTS notas_fiscais_tenant_delete ON public.notas_fiscais;
CREATE POLICY notas_fiscais_tenant_delete ON public.notas_fiscais
  FOR DELETE TO authenticated
  USING (
    public.empresa_membro_ativo(empresa_id)
    AND (public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'manager'::public.app_role))
  );

-- F5: check_integrity_invariants — remover blocos que referenciam
--     lalamove_orders, active_tracking, drivers, driver_approval_queue
--     (tabelas decommissionadas em 2026-08-25)
CREATE OR REPLACE FUNCTION public.check_integrity_invariants()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
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
$$;

-- F6: bloqueios_duplicidade — delete orphan FK + validate constraint
DELETE FROM public.bloqueios_duplicidade
  WHERE transacao_id NOT IN (SELECT id FROM public.transacoes_bancarias)
    AND transacao_id IS NOT NULL;
ALTER TABLE public.bloqueios_duplicidade
  VALIDATE CONSTRAINT bloqueios_duplicidade_transacao_id_fkey;

-- F7: cron jobs com SQL inválido corrigidos
-- pgss_weekly_baseline: comando truncado → replace com função correta
SELECT cron.unschedule('pgss_weekly_baseline')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='pgss_weekly_baseline');
SELECT cron.unschedule('pgss-weekly-baseline')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='pgss-weekly-baseline');
SELECT cron.schedule('pgss-weekly-baseline','0 4 * * 0',
  'SELECT public.compare_pg_stat_baseline();');

-- cron-failure-watch: watch_cron_failures() ambíguo → chamar com args
SELECT cron.unschedule('cron-failure-watch')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='cron-failure-watch');
SELECT cron.schedule('cron-failure-watch','10 * * * *',
  'SELECT public.watch_cron_failures(90,36);');

-- daily-log-retention: purge_old_rows() sem args inexiste → cleanup_log_tables()
SELECT cron.unschedule('daily-log-retention')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='daily-log-retention');
SELECT cron.schedule('daily-log-retention','0 3 * * *',
  'SELECT public.cleanup_log_tables();');

-- F8: 3 cron jobs ausentes (processar/gerar — já adicionados em 120000, apenas segurança)
SELECT cron.schedule('gerar-alertas-vencimento-diario','0 8 * * *',
  'select public.gerar_alertas_vencimento();')
  WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='gerar-alertas-vencimento-diario');
SELECT cron.schedule('gerar-contas-recorrentes-diario','35 3 * * *',
  'select public.gerar_contas_recorrentes();')
  WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='gerar-contas-recorrentes-diario');
SELECT cron.schedule('processar-regua-cobranca-diario','0 9 * * *',
  'select public.processar_regua_cobranca(null, false);')
  WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname='processar-regua-cobranca-diario');

-- Registro
INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
VALUES('20260825130000','fixes_phd_validation',ARRAY['fixes_phd_validation'])
ON CONFLICT DO NOTHING;
