-- 1) Multi-empresa: vínculo usuário ↔ empresa com papel por empresa
CREATE TABLE public.user_empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'visualizador',
  is_default BOOLEAN NOT NULL DEFAULT false,
  provisioned_via TEXT NOT NULL DEFAULT 'manual' CHECK (provisioned_via IN ('manual','sso','scim')),
  scim_external_id TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);
CREATE INDEX idx_user_empresas_user ON public.user_empresas(user_id);
CREATE INDEX idx_user_empresas_empresa ON public.user_empresas(empresa_id);
CREATE INDEX idx_user_empresas_scim ON public.user_empresas(scim_external_id) WHERE scim_external_id IS NOT NULL;

ALTER TABLE public.user_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own empresa links"
  ON public.user_empresas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage user_empresas"
  ON public.user_empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_user_empresas_updated
  BEFORE UPDATE ON public.user_empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: papel em empresa específica
CREATE OR REPLACE FUNCTION public.has_role_in_empresa(_user UUID, _empresa UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_empresas
    WHERE user_id = _user AND empresa_id = _empresa AND role = _role AND ativo = true
  );
$$;

-- 2) Vínculo provedor SSO ↔ empresa
ALTER TABLE public.sso_providers
  ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
CREATE INDEX idx_sso_providers_empresa ON public.sso_providers(empresa_id);

-- 3) Tokens SCIM (bearer hash SHA-256)
CREATE TABLE public.scim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  nome TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scim_tokens_empresa ON public.scim_tokens(empresa_id);
CREATE INDEX idx_scim_tokens_hash ON public.scim_tokens(token_hash) WHERE ativo = true;

ALTER TABLE public.scim_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scim_tokens"
  ON public.scim_tokens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) Log SCIM
CREATE TABLE public.scim_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES public.scim_tokens(id) ON DELETE SET NULL,
  empresa_id UUID,
  resource_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  external_id TEXT,
  user_id UUID,
  status_code INT NOT NULL,
  request_body JSONB,
  response_body JSONB,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scim_log_token ON public.scim_operations_log(token_id, created_at DESC);
CREATE INDEX idx_scim_log_empresa ON public.scim_operations_log(empresa_id, created_at DESC);

ALTER TABLE public.scim_operations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view scim logs"
  ON public.scim_operations_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) Estado OIDC PKCE em sso_login_attempts
ALTER TABLE public.sso_login_attempts
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS code_verifier_hash TEXT,
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_sso_attempts_state ON public.sso_login_attempts(state) WHERE state IS NOT NULL;