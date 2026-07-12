-- =====================================================================
-- ITEM 38 (v3) — Índices parciais com guarda por coluna
-- =====================================================================
CREATE OR REPLACE FUNCTION pg_temp.__idx_if_ok(
  p_index_name TEXT,
  p_table TEXT,
  p_cols TEXT[],
  p_ddl TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_col TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=p_table AND c.relkind='r') THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname=p_index_name) THEN
    RETURN false;
  END IF;
  FOREACH v_col IN ARRAY p_cols LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=p_table AND column_name=v_col) THEN
      RETURN false;
    END IF;
  END LOOP;
  EXECUTE p_ddl;
  RETURN true;
END $$;

DO $$
DECLARE v_created INT := 0;
BEGIN
  IF pg_temp.__idx_if_ok('idx_contas_pagar_pendentes_venc','contas_pagar',ARRAY['empresa_id','data_vencimento','status'],
    'CREATE INDEX idx_contas_pagar_pendentes_venc ON public.contas_pagar (empresa_id, data_vencimento) WHERE status = ''pendente''') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_contas_receber_pendentes_venc','contas_receber',ARRAY['empresa_id','data_vencimento','status'],
    'CREATE INDEX idx_contas_receber_pendentes_venc ON public.contas_receber (empresa_id, data_vencimento) WHERE status = ''pendente''') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_boletos_pendentes_venc','boletos',ARRAY['empresa_id','vencimento','status'],
    'CREATE INDEX idx_boletos_pendentes_venc ON public.boletos (empresa_id, vencimento) WHERE status IN (''pendente'',''enviado'')') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_fila_cobrancas_pendentes','fila_cobrancas',ARRAY['empresa_id','created_at','status'],
    'CREATE INDEX idx_fila_cobrancas_pendentes ON public.fila_cobrancas (empresa_id, created_at) WHERE status = ''pendente''') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_webhooks_log_retry_pending','webhooks_log',ARRAY['next_retry_at','status'],
    'CREATE INDEX idx_webhooks_log_retry_pending ON public.webhooks_log (next_retry_at) WHERE status IN (''pending'',''retrying'')') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_anomalias_novas','anomalias_detectadas',ARRAY['empresa_id','detectada_em','status'],
    'CREATE INDEX idx_anomalias_novas ON public.anomalias_detectadas (empresa_id, detectada_em DESC) WHERE status = ''nova''') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_login_attempts_active_locks','login_attempts',ARRAY['email','locked_until'],
    'CREATE INDEX idx_login_attempts_active_locks ON public.login_attempts (email, locked_until) WHERE locked_until IS NOT NULL') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_transacoes_pendentes','transacoes_bancarias',ARRAY['conta_bancaria_id','data','status'],
    'CREATE INDEX idx_transacoes_pendentes ON public.transacoes_bancarias (conta_bancaria_id, data DESC) WHERE status = ''pendente''') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_webhook_dlq_unresolved','webhook_dlq',ARRAY['source','created_at','resolved_at'],
    'CREATE INDEX idx_webhook_dlq_unresolved ON public.webhook_dlq (source, created_at DESC) WHERE resolved_at IS NULL') THEN v_created := v_created+1; END IF;

  IF pg_temp.__idx_if_ok('idx_prt_active','password_reset_tokens',ARRAY['user_id','expires_at','used_at'],
    'CREATE INDEX idx_prt_active ON public.password_reset_tokens (user_id, expires_at) WHERE used_at IS NULL') THEN v_created := v_created+1; END IF;

  INSERT INTO public.audit_logs (
    table_name, record_id, action, details, user_id, user_email, created_at
  ) VALUES (
    '_meta_hardening', gen_random_uuid(), 'ITEM_38',
    format('Partial indexes created: %s', v_created),
    NULL, 'system', now()
  );
END $$;
