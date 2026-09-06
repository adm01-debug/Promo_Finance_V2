-- Fix remaining exposed-data findings from the security scan.

-- 1) Safe SSO resolver for unauthenticated/corporate login UI.
CREATE OR REPLACE FUNCTION public.resolve_sso_providers_for_domain(p_domain text)
RETURNS TABLE (
  id uuid,
  nome text,
  tipo text,
  preset text,
  allowed_domains text[],
  force_sso_for_domains boolean,
  ordem integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT
    sp.id,
    sp.nome,
    sp.tipo,
    sp.preset,
    sp.allowed_domains,
    sp.force_sso_for_domains,
    sp.ordem
  FROM public.sso_providers sp
  WHERE sp.ativo = true
    AND length(trim(coalesce(p_domain, ''))) BETWEEN 3 AND 253
    AND trim(lower(p_domain)) = ANY (
      SELECT lower(domain)
      FROM unnest(sp.allowed_domains) AS domain
    )
  ORDER BY sp.ordem ASC, sp.nome ASC;
$$;

REVOKE ALL ON FUNCTION public.resolve_sso_providers_for_domain(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_sso_providers_for_domain(text) TO anon, authenticated, service_role;

-- 2) SSO providers table: only admins read/manage full sensitive records.
DROP POLICY IF EXISTS "Active SSO providers visible for login" ON public.sso_providers;
DROP POLICY IF EXISTS "Admins gerenciam SSO providers" ON public.sso_providers;
DROP POLICY IF EXISTS "Admins manage sso providers" ON public.sso_providers;

CREATE POLICY "Admins manage sso providers"
  ON public.sso_providers
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Security posture settings: admin-only full read/write.
DROP POLICY IF EXISTS "sec_settings_auth_select" ON public.security_settings;
DROP POLICY IF EXISTS "sec_settings_admin_all" ON public.security_settings;

CREATE POLICY "sec_settings_admin_all"
  ON public.security_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) Accounting entries: scope child rows through owned/company-scoped parent postings.
DROP POLICY IF EXISTS "Access via lancamento" ON public.partidas_contabeis;

CREATE POLICY "Partidas scoped by lancamento"
  ON public.partidas_contabeis
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lancamentos_contabeis lc
      WHERE lc.id = partidas_contabeis.lancamento_id
        AND (
          lc.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::public.app_role)
          OR lc.empresa_id IN (
            SELECT ue.empresa_id
            FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
              AND ue.ativo = true
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.lancamentos_contabeis lc
      WHERE lc.id = partidas_contabeis.lancamento_id
        AND (
          lc.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::public.app_role)
          OR lc.empresa_id IN (
            SELECT ue.empresa_id
            FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
              AND ue.ativo = true
          )
        )
    )
  );

CREATE INDEX IF NOT EXISTS idx_partidas_contabeis_lancamento_id ON public.partidas_contabeis(lancamento_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_empresa_user ON public.lancamentos_contabeis(empresa_id, user_id);

-- 5) Compliance evidence packages: scope through company-scoped verification parent.
DROP POLICY IF EXISTS "Access by verification_id" ON public.evidencias_pacotes;

-- Guard: 42703(verificacao_id) — column added by a later migration, may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='evidencias_pacotes' AND column_name='verificacao_id') THEN
    EXECUTE $sql$CREATE POLICY "Evidencias scoped by verificacao"
  ON public.evidencias_pacotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.verificacoes_conformidade vc
      WHERE vc.id = evidencias_pacotes.verificacao_id
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR vc.empresa_id IN (
            SELECT ue.empresa_id
            FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
              AND ue.ativo = true
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.verificacoes_conformidade vc
      WHERE vc.id = evidencias_pacotes.verificacao_id
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR vc.empresa_id IN (
            SELECT ue.empresa_id
            FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid()
              AND ue.ativo = true
          )
        )
    )
  )$sql$;
  END IF;
END $$;

-- Guard: 42703(verificacao_id) — column added by a later migration, may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='evidencias_pacotes' AND column_name='verificacao_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_evidencias_pacotes_verificacao_id ON public.evidencias_pacotes(verificacao_id)';
  END IF;
END $$;
-- Guard: 42703(empresa_id) — column may not exist on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='verificacoes_conformidade' AND column_name='empresa_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_verificacoes_conformidade_empresa ON public.verificacoes_conformidade(empresa_id)';
  END IF;
END $$;