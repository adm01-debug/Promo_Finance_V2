-- Hardening incremental: RLS roles, missing app columns, and access indexes

-- 1) Complete DARFs schema used by the tax UI and edge functions.
ALTER TABLE public.darfs
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS competencia text,
  ADD COLUMN IF NOT EXISTS valor_multa numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_juros numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'gerado',
  ADD COLUMN IF NOT EXISTS retencoes_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  ADD COLUMN IF NOT EXISTS data_pagamento date,
  ADD COLUMN IF NOT EXISTS codigo_barras text,
  ADD COLUMN IF NOT EXISTS linha_digitavel text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'darfs_status_check'
      AND conrelid = 'public.darfs'::regclass
  ) THEN
    ALTER TABLE public.darfs
      ADD CONSTRAINT darfs_status_check
      CHECK (status IN ('gerado', 'pago', 'vencido', 'cancelado'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_darfs_empresa_competencia ON public.darfs(empresa_id, competencia);
-- Guard: 42703(alerta_id) — column added by a later migration, may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='darfs' AND column_name='alerta_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_darfs_alerta_id ON public.darfs(alerta_id)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_darfs_status_vencimento ON public.darfs(status, data_vencimento);

-- 2) Complete SSO provider schema expected by SSO UI/functions.
ALTER TABLE public.sso_providers
  ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preset text,
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS client_secret_ref text,
  ADD COLUMN IF NOT EXISTS discovery_url text,
  ADD COLUMN IF NOT EXISTS authorization_endpoint text,
  ADD COLUMN IF NOT EXISTS token_endpoint text,
  ADD COLUMN IF NOT EXISTS userinfo_endpoint text,
  ADD COLUMN IF NOT EXISTS jwks_uri text,
  ADD COLUMN IF NOT EXISTS scopes text[] NOT NULL DEFAULT ARRAY['openid','profile','email'],
  ADD COLUMN IF NOT EXISTS entity_id_idp text,
  ADD COLUMN IF NOT EXISTS sso_url text,
  ADD COLUMN IF NOT EXISTS slo_url text,
  ADD COLUMN IF NOT EXISTS x509_cert text,
  ADD COLUMN IF NOT EXISTS metadata_xml text,
  ADD COLUMN IF NOT EXISTS name_id_format text NOT NULL DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  ADD COLUMN IF NOT EXISTS signature_algorithm text NOT NULL DEFAULT 'RSA-SHA256',
  ADD COLUMN IF NOT EXISTS allowed_domains text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS claim_mapping jsonb NOT NULL DEFAULT '{"email":"email","full_name":"name","groups":"groups"}'::jsonb,
  ADD COLUMN IF NOT EXISTS default_role public.app_role NOT NULL DEFAULT 'visualizador',
  ADD COLUMN IF NOT EXISTS auto_provision_users boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS force_sso_for_domains boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ultimo_teste_em timestamptz,
  ADD COLUMN IF NOT EXISTS ultimo_teste_sucesso boolean,
  ADD COLUMN IF NOT EXISTS ultimo_teste_mensagem text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sso_providers_ativo_ordem ON public.sso_providers(ativo, ordem) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_sso_providers_domains ON public.sso_providers USING gin(allowed_domains);
CREATE INDEX IF NOT EXISTS idx_sso_providers_empresa ON public.sso_providers(empresa_id);

-- 3) Add indexes used by common RLS predicates and admin checks.
CREATE INDEX IF NOT EXISTS idx_user_empresas_user_ativo_empresa ON public.user_empresas(user_id, ativo, empresa_id);
CREATE INDEX IF NOT EXISTS idx_user_empresas_empresa_ativo ON public.user_empresas(empresa_id, ativo);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_active ON public.user_roles(user_id, role, is_active);
CREATE INDEX IF NOT EXISTS idx_allowed_ips_created_at ON public.allowed_ips(created_at DESC);
-- Guard: 42703(empresa_id) — column may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='apuracoes_tributarias' AND column_name='empresa_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_apuracoes_tributarias_empresa ON public.apuracoes_tributarias(empresa_id)';
  END IF;
END $$;
-- Guard: 42703(empresa_id) — column may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='configuracoes_aprovacao' AND column_name='empresa_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_configuracoes_aprovacao_empresa ON public.configuracoes_aprovacao(empresa_id)';
  END IF;
END $$;

-- 4) Replace broad/public policies with authenticated scoped policies.
DROP POLICY IF EXISTS "Admins can manage allowed ips" ON public.allowed_ips;
DROP POLICY IF EXISTS "Admins can manage tax calculations" ON public.apuracoes_tributarias;
DROP POLICY IF EXISTS "Admins can manage approval config" ON public.configuracoes_aprovacao;
DROP POLICY IF EXISTS "Authenticated users can view darfs" ON public.darfs;
DROP POLICY IF EXISTS "Admins manage user_empresas" ON public.user_empresas;
DROP POLICY IF EXISTS "Users view own empresa links" ON public.user_empresas;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public read sso providers" ON public.sso_providers;

CREATE POLICY "Users view own empresa links"
  ON public.user_empresas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage user_empresas"
  ON public.user_empresas
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Guard: 42703(alerta_id) — column added by a later migration, may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='darfs' AND column_name='alerta_id') THEN
    EXECUTE $sql$CREATE POLICY "DARFs scoped by linked empresa"
  ON public.darfs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR empresa_id IN (
      SELECT ue.empresa_id
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo = true
    )
    OR alerta_id IN (
      SELECT at.id
      FROM public.alertas_tributarios at
      WHERE at.empresa_id IN (
        SELECT ue.empresa_id
        FROM public.user_empresas ue
        WHERE ue.user_id = auth.uid()
          AND ue.ativo = true
      )
    )
  )$sql$;
  ELSE
    EXECUTE $sql$CREATE POLICY "DARFs scoped by linked empresa"
  ON public.darfs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR empresa_id IN (
      SELECT ue.empresa_id
      FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid()
        AND ue.ativo = true
    )
  )$sql$;
  END IF;
END $$;

CREATE POLICY "Active SSO providers visible for login"
  ON public.sso_providers
  FOR SELECT
  TO authenticated
  USING (ativo = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5) Ensure write policies include WITH CHECK where old ALL policies omitted it.
DROP POLICY IF EXISTS "Empresa-based access" ON public.apuracoes_tributarias;
CREATE POLICY "apuracoes_tributarias_admin_all"
  ON public.apuracoes_tributarias
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Empresa-based access" ON public.configuracoes_aprovacao;
CREATE POLICY "configuracoes_aprovacao_admin_all"
  ON public.configuracoes_aprovacao
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));