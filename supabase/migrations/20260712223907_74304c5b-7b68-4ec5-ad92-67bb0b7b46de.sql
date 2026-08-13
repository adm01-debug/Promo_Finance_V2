
-- Configurações de workflows n8n por tipo de evento
CREATE TABLE IF NOT EXISTS public.n8n_workflow_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'driver_approval','driver_incident','alert_triggered','order_status_change',
    'route_deviation','driver_stopped','late_delivery','risk_score_high','custom'
  )),
  webhook_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  min_risk_score INTEGER NOT NULL DEFAULT 0 CHECK (min_risk_score BETWEEN 0 AND 100),
  max_risk_score INTEGER NOT NULL DEFAULT 100 CHECK (max_risk_score BETWEEN 0 AND 100),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_ms INTEGER NOT NULL DEFAULT 15000,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_n8n_cfg_event ON public.n8n_workflow_configs(event_type) WHERE enabled = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.n8n_workflow_configs TO authenticated;
GRANT ALL ON public.n8n_workflow_configs TO service_role;
ALTER TABLE public.n8n_workflow_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e managers gerenciam configs n8n"
  ON public.n8n_workflow_configs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- Auditoria de disparos
CREATE TABLE IF NOT EXISTS public.n8n_dispatch_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES public.n8n_workflow_configs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  risk_score INTEGER,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempt INTEGER NOT NULL DEFAULT 1,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_n8n_logs_created ON public.n8n_dispatch_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8n_logs_event ON public.n8n_dispatch_logs(event_type, created_at DESC);

GRANT SELECT ON public.n8n_dispatch_logs TO authenticated;
GRANT ALL ON public.n8n_dispatch_logs TO service_role;
ALTER TABLE public.n8n_dispatch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e managers visualizam logs n8n"
  ON public.n8n_dispatch_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- updated_at trigger
CREATE TRIGGER trg_n8n_cfg_updated
  BEFORE UPDATE ON public.n8n_workflow_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
