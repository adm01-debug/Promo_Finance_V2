
-- Enum tipo SSO
DO $$ BEGIN
  CREATE TYPE public.sso_tipo AS ENUM ('oidc', 'saml');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabela principal de provedores SSO
CREATE TABLE public.sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo public.sso_tipo NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  preset TEXT, -- 'azure', 'okta', 'google', 'onelogin', 'jumpcloud', 'adfs', 'custom'
  
  -- OIDC fields
  client_id TEXT,
  client_secret_ref TEXT, -- nome do secret no Lovable Cloud
  discovery_url TEXT,
  authorization_endpoint TEXT,
  token_endpoint TEXT,
  userinfo_endpoint TEXT,
  jwks_uri TEXT,
  scopes TEXT[] DEFAULT ARRAY['openid','profile','email'],
  
  -- SAML fields
  entity_id_idp TEXT,
  sso_url TEXT,
  slo_url TEXT,
  x509_cert TEXT,
  metadata_xml TEXT,
  name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  signature_algorithm TEXT DEFAULT 'RSA-SHA256',
  
  -- Common config
  allowed_domains TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  claim_mapping JSONB NOT NULL DEFAULT '{"email":"email","full_name":"name","groups":"groups"}'::jsonb,
  default_role public.app_role NOT NULL DEFAULT 'visualizador',
  auto_provision_users BOOLEAN NOT NULL DEFAULT true,
  force_sso_for_domains BOOLEAN NOT NULL DEFAULT false,
  
  ultimo_teste_em TIMESTAMPTZ,
  ultimo_teste_sucesso BOOLEAN,
  ultimo_teste_mensagem TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sso_providers_ativo ON public.sso_providers(ativo) WHERE ativo = true;
CREATE INDEX idx_sso_providers_domains ON public.sso_providers USING GIN(allowed_domains);

-- Tentativas de login
CREATE TABLE public.sso_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  email TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  error_code TEXT,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sso_attempts_provider ON public.sso_login_attempts(provider_id, created_at DESC);
CREATE INDEX idx_sso_attempts_created ON public.sso_login_attempts(created_at DESC);

-- Mapeamento de grupos -> roles
CREATE TABLE public.sso_role_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  idp_group TEXT NOT NULL,
  app_role public.app_role NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, idp_group)
);

CREATE INDEX idx_sso_role_mappings_provider ON public.sso_role_mappings(provider_id);

-- Validação: force_sso requer allowed_domains
CREATE OR REPLACE FUNCTION public.fn_validar_sso_provider()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.force_sso_for_domains = true AND (NEW.allowed_domains IS NULL OR array_length(NEW.allowed_domains, 1) IS NULL) THEN
    RAISE EXCEPTION 'force_sso_for_domains requer ao menos um domínio em allowed_domains';
  END IF;
  
  IF NEW.tipo = 'oidc' AND NEW.ativo = true AND (NEW.client_id IS NULL OR (NEW.discovery_url IS NULL AND NEW.authorization_endpoint IS NULL)) THEN
    RAISE EXCEPTION 'Provedor OIDC ativo requer client_id e discovery_url ou endpoints manuais';
  END IF;
  
  IF NEW.tipo = 'saml' AND NEW.ativo = true AND (NEW.sso_url IS NULL OR NEW.x509_cert IS NULL) THEN
    RAISE EXCEPTION 'Provedor SAML ativo requer sso_url e x509_cert';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_sso_provider
  BEFORE INSERT OR UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.fn_validar_sso_provider();

-- Trigger updated_at
CREATE TRIGGER trg_sso_providers_updated
  BEFORE UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de auditoria (redacted secrets)
CREATE OR REPLACE FUNCTION public.fn_audit_sso_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
BEGIN
  v_old := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) - 'client_secret_ref' ELSE NULL END;
  v_new := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) - 'client_secret_ref' ELSE NULL END;
  
  PERFORM public.log_audit(
    TG_OP::audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    v_old,
    v_new,
    'SSO provider change'
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_sso_providers
  AFTER INSERT OR UPDATE OR DELETE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_sso_changes();

-- RLS
ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_role_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam SSO providers"
  ON public.sso_providers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins veem tentativas SSO"
  ON public.sso_login_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere tentativas SSO"
  ON public.sso_login_attempts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins gerenciam role mappings"
  ON public.sso_role_mappings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
