-- ============================================================
-- Gap #38 — Isolamento multi-tenant direto em alertas / LGPD
-- Ambas as tabelas estavam vazias (0 linhas), logo não há backfill.
-- empresa_id é NULLABLE de propósito: user_empresas ainda está vazio
-- e forçar NOT NULL quebraria inserts de usuários sem empresa vinculada.
-- ============================================================

ALTER TABLE public.alertas
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;

ALTER TABLE public.solicitacoes_lgpd
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_alertas_empresa_id
  ON public.alertas (empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_empresa_id
  ON public.solicitacoes_lgpd (empresa_id, created_at DESC);

-- ------------------------------------------------------------
-- Preenchimento automático a partir do perfil do autor.
-- SECURITY DEFINER porque profiles tem RLS própria e o trigger
-- precisa ler a linha do autor mesmo em contexto de service_role.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_empresa_id_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    SELECT p.empresa_id INTO NEW.empresa_id
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alertas_set_empresa ON public.alertas;
CREATE TRIGGER trg_alertas_set_empresa
  BEFORE INSERT ON public.alertas
  FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_from_profile();

DROP TRIGGER IF EXISTS trg_solicitacoes_lgpd_set_empresa ON public.solicitacoes_lgpd;
CREATE TRIGGER trg_solicitacoes_lgpd_set_empresa
  BEFORE INSERT ON public.solicitacoes_lgpd
  FOR EACH ROW EXECUTE FUNCTION public.set_empresa_id_from_profile();

-- ------------------------------------------------------------
-- alertas: mantém escopo por dono, mas bloqueia gravar um alerta
-- apontando para empresa de terceiros.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Owner manage alertas" ON public.alertas;

CREATE POLICY "alertas_owner_select" ON public.alertas
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "alertas_owner_insert" ON public.alertas
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (empresa_id IS NULL OR public.empresa_acessivel(empresa_id))
  );

CREATE POLICY "alertas_owner_update" ON public.alertas
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (empresa_id IS NULL OR public.empresa_acessivel(empresa_id))
  );

CREATE POLICY "alertas_owner_delete" ON public.alertas
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------
-- solicitacoes_lgpd: admin deixa de ser global.
-- Antes, has_role(admin) dava acesso a solicitações de TODAS as
-- empresas — vazamento cross-tenant de dado pessoal (LGPD).
-- Agora o admin precisa também ter acesso à empresa do registro.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS lgpd_owner_select ON public.solicitacoes_lgpd;
DROP POLICY IF EXISTS lgpd_admin_update ON public.solicitacoes_lgpd;
DROP POLICY IF EXISTS lgpd_owner_insert ON public.solicitacoes_lgpd;

CREATE POLICY "lgpd_owner_insert" ON public.solicitacoes_lgpd
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (empresa_id IS NULL OR public.empresa_acessivel(empresa_id))
  );

CREATE POLICY "lgpd_scoped_select" ON public.solicitacoes_lgpd
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (
      public.has_role((SELECT auth.uid()), 'admin')
      AND empresa_id IS NOT NULL
      AND public.empresa_membro_ativo(empresa_id)
    )
  );

CREATE POLICY "lgpd_scoped_update" ON public.solicitacoes_lgpd
  FOR UPDATE TO authenticated
  USING (
    public.has_role((SELECT auth.uid()), 'admin')
    AND empresa_id IS NOT NULL
    AND public.empresa_membro_ativo(empresa_id)
  )
  WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin')
    AND empresa_id IS NOT NULL
    AND public.empresa_membro_ativo(empresa_id)
  );