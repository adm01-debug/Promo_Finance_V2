-- Indexes to support foreign keys (prevents sequential scans on parent DELETE/UPDATE and joins)
CREATE INDEX IF NOT EXISTS idx_convites_organizacao_id
  ON public.convites (organizacao_id);

CREATE INDEX IF NOT EXISTS idx_webhooks_log_dlq_id
  ON public.webhooks_log (dlq_id) WHERE dlq_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_n8n_workflow_configs_created_by
  ON public.n8n_workflow_configs (created_by) WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_n8n_dispatch_logs_config_id
  ON public.n8n_dispatch_logs (config_id) WHERE config_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_empresas_certificados_criado_por
  ON public.empresas_certificados (criado_por) WHERE criado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nfe_eventos_created_by
  ON public.nfe_eventos (created_by) WHERE created_by IS NOT NULL;

-- Assertion: no single-column FK in public schema may remain without a supporting index
DO $$
DECLARE v_missing int;
BEGIN
  SELECT count(*) INTO v_missing
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND array_length(c.conkey, 1) = 1
    AND NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1]
    );
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Ainda existem % chaves estrangeiras sem indice de suporte', v_missing;
  END IF;
END $$;