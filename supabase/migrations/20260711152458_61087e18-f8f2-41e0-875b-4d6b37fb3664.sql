
-- Índices em colunas de alta cardinalidade para acelerar RLS + filtros de UI
CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_status_venc
  ON public.contas_pagar (empresa_id, status, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_created
  ON public.contas_pagar (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_data_pagamento
  ON public.contas_pagar (data_pagamento) WHERE data_pagamento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_status_venc
  ON public.contas_receber (empresa_id, status, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_user_created
  ON public.contas_receber (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contas_receber_data_recebimento
  ON public.contas_receber (data_recebimento) WHERE data_recebimento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_last
  ON public.login_attempts (lower(email), last_attempt_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type
  ON public.webhook_events (event_type);

CREATE INDEX IF NOT EXISTS idx_frontend_error_logs_user_created
  ON public.frontend_error_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_telemetry_user_created
  ON public.query_telemetry (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_historico_cobranca_empresa_status_created
  ON public.historico_cobranca (empresa_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_cobranca_conta_receber
  ON public.historico_cobranca (conta_receber_id);
