-- =====================================================================
-- ITEM 37 — SET STATISTICS 1000 em colunas críticas
-- =====================================================================
DO $$
DECLARE
  v_targets JSONB := '[
    {"t":"contas_pagar","cols":["empresa_id","status","data_vencimento"]},
    {"t":"contas_receber","cols":["empresa_id","status","data_vencimento"]},
    {"t":"boletos","cols":["empresa_id","status","data_vencimento"]},
    {"t":"fila_cobrancas","cols":["empresa_id","status"]},
    {"t":"webhooks_log","cols":["source","status","external_id"]},
    {"t":"transacoes_bancarias","cols":["empresa_id","status","conta_bancaria_id","data"]},
    {"t":"extrato_bancario","cols":["conta_bancaria_id","data"]},
    {"t":"clientes","cols":["empresa_id"]},
    {"t":"fornecedores","cols":["empresa_id"]},
    {"t":"notas_fiscais","cols":["empresa_id","status"]},
    {"t":"anomalias_detectadas","cols":["empresa_id","status","severidade"]},
    {"t":"query_telemetry","cols":["operation","severity","table_name"]},
    {"t":"user_roles","cols":["user_id","role","is_active"]},
    {"t":"profiles","cols":["user_id","empresa_id","role"]},
    {"t":"login_attempts","cols":["email","ip_address"]},
    {"t":"auth_logs","cols":["user_id","event_type"]},
    {"t":"runtime_error_logs","cols":["user_id","error_hash"]},
    {"t":"asaas_payments","cols":["empresa_id","status"]}
  ]'::jsonb;
  v_row JSONB;
  v_table TEXT;
  v_col TEXT;
  v_applied INT := 0;
  v_skipped INT := 0;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(v_targets) LOOP
    v_table := v_row->>'t';
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND c.relname=v_table
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    FOR v_col IN SELECT jsonb_array_elements_text(v_row->'cols') LOOP
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=v_table AND column_name=v_col
      ) THEN
        BEGIN
          EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET STATISTICS 1000', v_table, v_col);
          v_applied := v_applied + 1;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Skip %.% : %', v_table, v_col, SQLERRM;
          v_skipped := v_skipped + 1;
        END;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    END LOOP;
  END LOOP;

  INSERT INTO public.audit_logs (
    table_name, record_id, action, details, user_id, user_email, created_at
  ) VALUES (
    '_meta_hardening', gen_random_uuid(), 'ITEM_37',
    format('SET STATISTICS 1000 applied to %s columns (skipped %s)', v_applied, v_skipped),
    NULL, 'system', now()
  );
END $$;
