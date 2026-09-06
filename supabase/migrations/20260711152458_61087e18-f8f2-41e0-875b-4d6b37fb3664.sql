
-- Índices em colunas de alta cardinalidade para acelerar RLS + filtros de UI
-- Guards: 42P01/42703 — tables or columns may not exist yet on preview branch

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contas_pagar') THEN
    CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_status_venc
      ON public.contas_pagar (empresa_id, status, data_vencimento);
    CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_created
      ON public.contas_pagar (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contas_pagar_data_pagamento
      ON public.contas_pagar (data_pagamento) WHERE data_pagamento IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='contas_receber') THEN
    CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_status_venc
      ON public.contas_receber (empresa_id, status, data_vencimento);
    CREATE INDEX IF NOT EXISTS idx_contas_receber_user_created
      ON public.contas_receber (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contas_receber_data_recebimento
      ON public.contas_receber (data_recebimento) WHERE data_recebimento IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
      ON public.audit_logs (user_id, created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='login_attempts' AND column_name='email') THEN
    CREATE INDEX IF NOT EXISTS idx_login_attempts_email_last
      ON public.login_attempts (lower(email), last_attempt_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='webhook_events') THEN
    CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type
      ON public.webhook_events (event_type);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='frontend_error_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_frontend_error_logs_user_created
      ON public.frontend_error_logs (user_id, created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='query_telemetry') THEN
    CREATE INDEX IF NOT EXISTS idx_query_telemetry_user_created
      ON public.query_telemetry (user_id, created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='historico_cobranca' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_historico_cobranca_empresa_status_created
      ON public.historico_cobranca (empresa_id, status, created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='historico_cobranca' AND column_name='conta_receber_id') THEN
    CREATE INDEX IF NOT EXISTS idx_historico_cobranca_conta_receber
      ON public.historico_cobranca (conta_receber_id);
  END IF;
END $$;
