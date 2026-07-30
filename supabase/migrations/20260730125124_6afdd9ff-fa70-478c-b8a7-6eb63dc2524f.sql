-- ============================================================================
-- Gate #35 — Governança de retenção de dados
-- ----------------------------------------------------------------------------
-- Problema: a política de retenção vivia como VALUES hard-coded dentro de
-- cleanup_log_tables(). Consequências observadas na auditoria:
--   (a) 25 tabelas log-like sem qualquer purga (crescimento ilimitado);
--   (b) nenhuma forma de auditar/justificar isenções;
--   (c) nenhuma barreira impedindo a criação de novas tabelas de log sem TTL.
-- Solução: política declarativa em tabela + rotina data-driven + gate de CI.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.retencao_politicas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela       text NOT NULL UNIQUE,          -- 'schema.tabela'
  coluna       text,                          -- coluna temporal usada no corte
  dias         integer,                       -- NULL => isenção justificada
  filtro       text,                          -- predicado adicional opcional
  motivo       text NOT NULL,                 -- justificativa auditável
  ativo        boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  -- Uma política ativa com dias definido exige coluna temporal; isenção exige
  -- dias NULL. Isso impede registros ambíguos que o purge não saberia aplicar.
  CONSTRAINT retencao_politicas_coerencia CHECK (
    (dias IS NULL AND coluna IS NULL) OR (dias >= 1 AND coluna IS NOT NULL)
  )
);

GRANT SELECT ON public.retencao_politicas TO authenticated;
GRANT ALL    ON public.retencao_politicas TO service_role;

ALTER TABLE public.retencao_politicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS retencao_politicas_admin_select ON public.retencao_politicas;
CREATE POLICY retencao_politicas_admin_select
  ON public.retencao_politicas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_retencao_politicas_updated_at ON public.retencao_politicas;
CREATE TRIGGER trg_retencao_politicas_updated_at
  BEFORE UPDATE ON public.retencao_politicas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Seed: 30 regras migradas do corpo de cleanup_log_tables + 25 novas.
-- ---------------------------------------------------------------------------
INSERT INTO public.retencao_politicas (tabela, coluna, dias, filtro, motivo) VALUES
  -- === migradas (comportamento idêntico ao anterior) ===
  ('public.audit_logs_default',          'created_at',  180, NULL, 'Overflow de particionamento; janela de auditoria operacional'),
  ('public.frontend_error_logs_default', 'created_at',   30, NULL, 'Overflow de particionamento; erros de frontend são efêmeros'),
  ('public.auth_logs',                   'created_at',   90, NULL, 'Trilha de autenticação — 90d cobre investigação de incidentes'),
  ('public.frontend_performance_logs',   'created_at',   14, NULL, 'Telemetria de performance de alta cardinalidade'),
  ('public.runtime_error_logs',          'created_at',   30, NULL, 'Erros de runtime já agregados por assinatura'),
  ('public.query_telemetry',             'created_at',   30, NULL, 'Telemetria de queries de alto volume'),
  ('public.rate_limit_logs',             'created_at',   30, NULL, 'Contadores de rate limit sem valor histórico'),
  ('public.sso_login_attempts',          'created_at',   90, NULL, 'Tentativas SSO — janela de investigação'),
  ('public.cron_job_logs',               'created_at',   30, NULL, 'Execuções de cron; falhas relevantes viram alerta'),
  ('public.webhooks_log',                'created_at',   60, 'status NOT IN (''dead'',''retrying'')', 'Preserva pendentes e DLQ'),
  ('public.bitrix_sync_logs',            'created_at',   60, NULL, 'Log de integração Bitrix'),
  ('public.bitrix_webhook_events',       'created_at',   30, NULL, 'Eventos brutos já processados'),
  ('public.n8n_dispatch_logs',           'created_at',   60, NULL, 'Disparos n8n'),
  ('public.digest_envios_log',           'created_at',   90, NULL, 'Envios de digest'),
  ('public.alerts_sent',                 'created_at',   90, NULL, 'Deduplicação de alertas enviados'),
  ('public.historico_cobranca_whatsapp', 'created_at',  365, NULL, 'Prova de comunicação de cobrança'),
  ('public.slow_query_alerts',           'created_at',   60, NULL, 'Alertas de performance'),
  ('public.pg_stat_statements_baseline', 'created_at',   30, NULL, 'Baseline móvel de performance'),
  ('public.bloat_snapshots',             'created_at',   90, NULL, 'Série de bloat para tendência trimestral'),
  ('public.anomalia_detection_runs',     'created_at',   90, NULL, 'Execuções do detector de anomalias'),
  ('public.logs_baixa_automatica',       'created_at',  180, NULL, 'Rastreabilidade de baixas automáticas'),
  ('public.logs_conciliacao_retroativa', 'created_at',  180, NULL, 'Rastreabilidade de conciliação'),
  ('public.ci_security_gate_events',     'created_at',  180, NULL, 'Histórico de gates de segurança no CI'),
  ('public.catalogos_tributarios_health_history', 'dia', 400, NULL, '400d preserva comparação ano a ano'),
  ('public.integrity_alerts',            'created_at',   90, 'resolved_at IS NOT NULL', 'Somente alertas encerrados'),
  ('public.performance_alerts',          'created_at',   90, 'resolved_at IS NOT NULL', 'Somente alertas encerrados'),
  ('public.security_audit_logs',         'created_at', 1825, NULL, 'Retenção legal de 5 anos'),
  ('public.user_action_audit',           'created_at', 1825, NULL, 'Retenção legal de 5 anos'),
  ('public.auditoria_financeira',        'created_at', 1825, NULL, 'Retenção legal de 5 anos'),
  ('public.asaas_audit_trail',           'created_at', 1825, NULL, 'Retenção legal de 5 anos'),

  -- === novas: tabelas que cresciam sem TTL ===
  ('public.edge_function_logs',          'created_at',   30, NULL, 'Log de execução de edge functions'),
  ('public.index_usage_snapshots',       'created_at',  120, NULL, 'Snapshots diários; Gate #34 usa janela de 30d'),
  ('public.login_attempts',              'created_at',   90, NULL, 'Tentativas de login — janela de investigação'),
  ('public.tracking_events',             'created_at',  180, NULL, 'Eventos de rastreamento de entrega'),
  ('public.scim_operations_log',         'created_at',  180, NULL, 'Provisionamento SCIM'),
  ('public.notification_history',        'created_at',   90, NULL, 'Histórico de notificações in-app'),
  ('public.bling_sync_logs',             'created_at',   60, NULL, 'Log de integração Bling'),
  ('public.bling_webhook_events',        'created_at',   30, NULL, 'Eventos brutos já processados'),
  ('public.eventos_contabilizacao_log',  'created_at',  180, NULL, 'Idempotência de contabilização'),
  ('public.frontend_error_silence_digest_log', 'created_at', 90, NULL, 'Digest de silenciamentos'),
  ('public.sso_sandbox_runs',            'created_at',   30, NULL, 'Execuções de sandbox SSO'),
  ('public.webhook_simulation_runs',     'created_at',   30, NULL, 'Simulações de webhook (não produtivo)'),
  ('public.regime_decision_cache',       'created_at',    7, NULL, 'Cache de decisão de regime'),
  ('public.cnpja_cache',                 'created_at',   30, NULL, 'Cache de consulta CNPJá'),
  ('public.historico_score_saude',       'created_at',  400, NULL, 'Série de score com comparação anual'),
  ('public.lalamove_status_history',     'created_at',  365, NULL, 'Histórico de status de pedidos'),
  ('public.conformidade_snapshots',      'created_at',  730, NULL, 'Evidência de conformidade — 2 anos'),
  ('public.historico_conciliacao_ia',    'created_at',  365, NULL, 'Aprendizado do motor de conciliação'),
  ('public.historico_analises_preditivas','created_at', 365, NULL, 'Backtesting de previsões'),
  ('public.historico_cobranca',          'created_at', 1825, NULL, 'Prova de cobrança — retenção legal'),
  ('public.historico_cobrancas_boletos', 'created_at', 1825, NULL, 'Prova de cobrança — retenção legal'),
  ('public.tax_audit_trail',             'created_at', 1825, NULL, 'Trilha fiscal — retenção legal'),
  ('public.elisao_creditos_auditoria',   'created_at', 1825, NULL, 'Trilha fiscal — retenção legal'),
  ('public.nfe_eventos',                 'created_at', 1825, NULL, 'Eventos fiscais — guarda de 5 anos'),
  ('public.overlay_rejeicoes_auditoria', 'created_at',  730, 'resolvido_em IS NOT NULL', 'Somente rejeições resolvidas'),
  ('public.anomalia_toast_eventos',      'dispatched_at', 30, NULL, 'Deduplicação de toasts'),

  -- === isenções justificadas (dias NULL) ===
  ('public.fila_cobrancas',              NULL, NULL, NULL, 'Fila operacional: expurgo é feito pelo próprio worker'),
  ('public.asaas_sync_queue',            NULL, NULL, NULL, 'Fila operacional: itens pendentes não podem expirar por tempo'),
  ('public.catalogos_fiscais_cargas',    NULL, NULL, NULL, 'Manifesto de cargas fiscais — evidência permanente'),
  ('public.notas_fiscais_ocr',           NULL, NULL, NULL, 'Documento fiscal, não é log'),
  ('public.historico_relatorios',        NULL, NULL, NULL, 'Volume desprezível; vínculo com artefatos exportados'),
  ('public.auditoria_tributaria',        NULL, NULL, NULL, 'Trilha fiscal permanente'),
  ('public.webhook_events',              NULL, NULL, NULL, 'Sem coluna temporal; expurgo via tabela de log associada'),
  ('public.driver_approval_queue',       NULL, NULL, NULL, 'Fila de aprovação operacional')
ON CONFLICT (tabela) DO NOTHING;

-- ---------------------------------------------------------------------------
-- cleanup_log_tables agora é data-driven.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_log_tables()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $fn$
DECLARE
  v_start   timestamptz := now();
  v_result  jsonb := '{}'::jsonb;
  v_log_id  uuid;
  v_rec     RECORD;
  v_deleted bigint;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('cleanup_log_tables')) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'lock_held');
  END IF;

  INSERT INTO public.cron_job_logs (job_name, executed_at)
  VALUES ('daily-log-retention', v_start)
  RETURNING id INTO v_log_id;

  FOR v_rec IN
    SELECT tabela, coluna, dias, filtro
      FROM public.retencao_politicas
     WHERE ativo IS TRUE AND dias IS NOT NULL
     ORDER BY tabela
  LOOP
    -- Tabela pode ter sido removida por migration posterior: nunca aborta o job.
    IF to_regclass(v_rec.tabela) IS NULL THEN
      CONTINUE;
    END IF;

    BEGIN
      v_deleted := public.purge_old_rows(
        v_rec.tabela::regclass, v_rec.coluna, v_rec.dias, v_rec.filtro
      );
    EXCEPTION WHEN OTHERS THEN
      -- Uma política inválida não pode impedir a purga das demais.
      v_result := v_result || jsonb_build_object(
        'erro_' || split_part(v_rec.tabela, '.', 2), SQLERRM
      );
      CONTINUE;
    END;

    IF v_deleted > 0 THEN
      v_result := v_result || jsonb_build_object(split_part(v_rec.tabela, '.', 2), v_deleted);
    END IF;
  END LOOP;

  v_result := v_result || jsonb_build_object('partitions', public.maintain_monthly_partitions());

  v_result := v_result || jsonb_build_object(
    'politicas_aplicadas', (SELECT count(*) FROM public.retencao_politicas WHERE ativo AND dias IS NOT NULL),
    'duration_ms', (EXTRACT(EPOCH FROM (now() - v_start)) * 1000)::integer,
    'success', true
  );

  UPDATE public.cron_job_logs
     SET completed_at = now(),
         duration_ms  = (v_result->>'duration_ms')::integer,
         result       = v_result,
         success      = true
   WHERE id = v_log_id;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.cron_job_logs
     SET completed_at = now(), success = false, error_message = SQLERRM
   WHERE id = v_log_id;
  RAISE;
END;
$fn$;

REVOKE ALL ON FUNCTION public.cleanup_log_tables() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_log_tables() TO service_role;

-- ---------------------------------------------------------------------------
-- Gate #35 — tabelas log-like sem política de retenção declarada.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gate_35_tabelas_sem_retencao()
RETURNS TABLE (tabela text, coluna_temporal text, tamanho text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $fn$
  SELECT ('public.' || c.relname)::text,
         (SELECT a.attname::text
            FROM pg_attribute a
            JOIN pg_type t ON t.oid = a.atttypid
           WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
             AND t.typname IN ('timestamptz','timestamp','date')
           ORDER BY (a.attname IN ('created_at','executed_at','dia')) DESC, a.attnum
           LIMIT 1),
         pg_size_pretty(pg_total_relation_size(c.oid))
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND NOT c.relispartition
     AND c.relname !~ '_(default|[0-9]{4}_[0-9]{2})$'
     AND c.relname ~ '(_log|_logs|logs_|_history|historico_|_snapshots|_events|_eventos|_attempts|_trail|auditoria_|_audit|telemetr|_cache|_runs|_queue)'
     AND EXISTS (
       SELECT 1 FROM pg_attribute a
        JOIN pg_type t ON t.oid = a.atttypid
       WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
         AND t.typname IN ('timestamptz','timestamp','date')
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.retencao_politicas p
        WHERE p.tabela = 'public.' || c.relname
     )
   ORDER BY pg_total_relation_size(c.oid) DESC;
$fn$;

REVOKE ALL ON FUNCTION public.gate_35_tabelas_sem_retencao() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gate_35_tabelas_sem_retencao() TO service_role;