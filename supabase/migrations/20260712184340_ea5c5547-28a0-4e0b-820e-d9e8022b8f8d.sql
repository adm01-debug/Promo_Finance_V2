
DO $$
DECLARE
  v_tables text[] := ARRAY[
    'alerts','alerts_sent','anomalia_detection_runs','anomalia_toast_eventos',
    'auditoria_financeira','bitrix24_activities','bitrix_sync_logs','bitrix_webhook_events',
    'driver_incidents','driver_locations','feedback_conciliacao_ia',
    'historico_analises_preditivas','historico_cobranca_whatsapp','historico_cobrancas_boletos',
    'historico_conciliacao_ia','historico_score_saude',
    'lalamove_status_history','logs_conciliacao_retroativa',
    'tracking_events','webhook_events','webhook_simulation_results'
  ];
  v_tbl text;
BEGIN
  FOREACH v_tbl IN ARRAY v_tables LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_tbl AND c.relkind = 'r'
    ) THEN
      EXECUTE format($f$
        ALTER TABLE public.%I SET (
          autovacuum_vacuum_scale_factor = 0.05,
          autovacuum_analyze_scale_factor = 0.02,
          autovacuum_vacuum_threshold = 1000,
          autovacuum_analyze_threshold = 500,
          autovacuum_vacuum_cost_limit = 2000,
          autovacuum_vacuum_cost_delay = 10
        )
      $f$, v_tbl);
    END IF;
  END LOOP;
END $$;

-- Registrar no audit_logs
INSERT INTO public.audit_logs (table_name, action, details, new_data, created_at)
VALUES (
  '_meta_hardening',
  'autovacuum_tuning_extension',
  'ITEM_36_EXT: autovacuum agressivo estendido para 21 tabelas append-only adicionais',
  jsonb_build_object(
    'scale_factor', 0.05,
    'analyze_scale_factor', 0.02,
    'vacuum_threshold', 1000,
    'analyze_threshold', 500,
    'vacuum_cost_limit', 2000,
    'vacuum_cost_delay', 10,
    'tables_count', 21
  ),
  now()
);
