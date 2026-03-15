
-- Bling OAuth tokens storage
CREATE TABLE public.bling_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.bling_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bling tokens" ON public.bling_tokens
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Bling sync logs
CREATE TABLE public.bling_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  modulo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  registros_processados int DEFAULT 0,
  registros_com_erro int DEFAULT 0,
  detalhes jsonb,
  mensagem_erro text,
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bling_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and financeiro can view bling sync logs" ON public.bling_sync_logs
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]));

CREATE POLICY "Admins and financeiro can insert bling sync logs" ON public.bling_sync_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Bling webhook events
CREATE TABLE public.bling_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  module text NOT NULL,
  resource_id text,
  payload jsonb,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  retries int DEFAULT 0,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bling_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bling webhook events" ON public.bling_webhook_events
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Indexes
CREATE INDEX idx_bling_webhook_events_processed ON public.bling_webhook_events(processed);
CREATE INDEX idx_bling_webhook_events_module ON public.bling_webhook_events(module);
CREATE INDEX idx_bling_sync_logs_modulo ON public.bling_sync_logs(modulo);
CREATE INDEX idx_bling_sync_logs_status ON public.bling_sync_logs(status);

-- Trigger for updated_at on bling_tokens
CREATE TRIGGER set_bling_tokens_updated_at
  BEFORE UPDATE ON public.bling_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
