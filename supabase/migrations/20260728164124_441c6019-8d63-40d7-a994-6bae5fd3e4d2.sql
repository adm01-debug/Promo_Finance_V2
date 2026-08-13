-- ===== Mapeamento grupo IdP -> papel =====
CREATE TABLE IF NOT EXISTS public.sso_role_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  idp_group TEXT NOT NULL CHECK (char_length(btrim(idp_group)) BETWEEN 1 AND 200),
  app_role public.app_role NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0 CHECK (ordem >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sso_role_mapping_unico UNIQUE (provider_id, idp_group)
);
CREATE INDEX IF NOT EXISTS idx_sso_role_mappings_provider ON public.sso_role_mappings (provider_id, ordem);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sso_role_mappings TO authenticated;
GRANT ALL ON public.sso_role_mappings TO service_role;
ALTER TABLE public.sso_role_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sso_role_mappings_admin" ON public.sso_role_mappings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Grupos do usuário sincronizados no login =====
CREATE TABLE IF NOT EXISTS public.sso_user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  groups TEXT[] NOT NULL DEFAULT '{}',
  matched_group TEXT,
  matched_role public.app_role,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sso_user_group_unico UNIQUE (user_id, provider_id)
);
CREATE INDEX IF NOT EXISTS idx_sso_user_groups_user ON public.sso_user_groups (user_id);
GRANT SELECT ON public.sso_user_groups TO authenticated;
GRANT ALL ON public.sso_user_groups TO service_role;
ALTER TABLE public.sso_user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sso_user_groups_select" ON public.sso_user_groups
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ===== Log de operações SCIM =====
CREATE TABLE IF NOT EXISTS public.scim_operations_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID,
  empresa_id UUID,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('User','Group','Schema','ResourceType','ServiceProviderConfig','Bulk')),
  operation TEXT NOT NULL CHECK (operation IN ('create','read','list','replace','patch','delete','deactivate','error')),
  external_id TEXT,
  user_id UUID,
  status_code INTEGER NOT NULL CHECK (status_code BETWEEN 100 AND 599),
  request_body JSONB,
  response_body JSONB,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scim_ops_created ON public.scim_operations_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scim_ops_token ON public.scim_operations_log (token_id, created_at DESC);
GRANT SELECT ON public.scim_operations_log TO authenticated;
GRANT ALL ON public.scim_operations_log TO service_role;
ALTER TABLE public.scim_operations_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scim_operations_log_admin_select" ON public.scim_operations_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== Histórico do sandbox de SSO =====
CREATE TABLE IF NOT EXISTS public.sso_sandbox_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID,
  created_by_email TEXT,
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE SET NULL,
  provider_nome TEXT,
  use_provider_config BOOLEAN NOT NULL DEFAULT true,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome TEXT NOT NULL CHECK (outcome IN ('bloqueado','seria_jit','usuario_existente','sem_email')),
  email_masked TEXT,
  resolved_role TEXT,
  matched_group TEXT,
  has_errors BOOLEAN NOT NULL DEFAULT false,
  batch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sso_sandbox_runs_created ON public.sso_sandbox_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sso_sandbox_runs_batch ON public.sso_sandbox_runs (batch_id);
GRANT SELECT, INSERT, DELETE ON public.sso_sandbox_runs TO authenticated;
GRANT ALL ON public.sso_sandbox_runs TO service_role;
ALTER TABLE public.sso_sandbox_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sso_sandbox_runs_admin" ON public.sso_sandbox_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE TRIGGER trg_sso_role_mappings_updated_at
  BEFORE UPDATE ON public.sso_role_mappings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_sso_user_groups_updated_at
  BEFORE UPDATE ON public.sso_user_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();