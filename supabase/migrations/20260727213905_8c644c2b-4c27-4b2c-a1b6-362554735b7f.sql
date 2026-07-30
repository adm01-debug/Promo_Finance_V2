-- Enum de papel DENTRO da organização (não confundir com app_role, que segue
-- sendo a fonte de verdade de privilégio de sistema em public.user_roles).
DO $$ BEGIN
  CREATE TYPE public.org_papel AS ENUM ('RESPONSAVEL','ADMIN','MEMBRO','LEITOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== organizacoes =====
CREATE TABLE public.organizacoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           TEXT NOT NULL,
  cnpj           TEXT UNIQUE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('ESCRITORIO_CONTABIL','EMPRESA','CONSULTORIA','OUTRO')),
  responsavel_id UUID NOT NULL,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizacoes TO authenticated;
GRANT ALL ON public.organizacoes TO service_role;
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_organizacoes_responsavel ON public.organizacoes(responsavel_id);

CREATE TRIGGER trg_organizacoes_updated_at
  BEFORE UPDATE ON public.organizacoes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== organizacao_membros =====
CREATE TABLE public.organizacao_membros (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  usuario_id     UUID NOT NULL,
  papel_na_org   public.org_papel NOT NULL DEFAULT 'MEMBRO',
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  convidado_por  UUID,
  aceito_em      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_org_membro UNIQUE (organizacao_id, usuario_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizacao_membros TO authenticated;
GRANT ALL ON public.organizacao_membros TO service_role;
ALTER TABLE public.organizacao_membros ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_org_membros_usuario ON public.organizacao_membros(usuario_id) WHERE ativo;
CREATE INDEX idx_org_membros_org ON public.organizacao_membros(organizacao_id) WHERE ativo;

CREATE TRIGGER trg_org_membros_updated_at
  BEFORE UPDATE ON public.organizacao_membros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== convites =====
CREATE TABLE public.convites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id  UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  email_convidado TEXT NOT NULL,
  papel_proposto  public.org_papel NOT NULL DEFAULT 'MEMBRO',
  token           TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expira_em       TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  utilizado_em    TIMESTAMPTZ,
  convidado_por   UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites TO authenticated;
GRANT ALL ON public.convites TO service_role;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_convites_email ON public.convites(email_convidado) WHERE utilizado_em IS NULL;
CREATE INDEX idx_convites_token ON public.convites(token) WHERE utilizado_em IS NULL;

-- ===== Helpers SECURITY DEFINER (evitam recursão de RLS) =====
CREATE OR REPLACE FUNCTION public.is_org_membro(_org_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizacao_membros
    WHERE organizacao_id = _org_id AND usuario_id = _user_id AND ativo
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_responsavel(_org_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizacoes
    WHERE id = _org_id AND responsavel_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_membro(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_org_responsavel(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_membro(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_responsavel(UUID, UUID) TO authenticated, service_role;

-- ===== Policies: organizacoes =====
CREATE POLICY "organizacoes_select_membro_ou_admin" ON public.organizacoes
  FOR SELECT TO authenticated
  USING (
    responsavel_id = auth.uid()
    OR public.is_org_membro(id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "organizacoes_insert_proprio" ON public.organizacoes
  FOR INSERT TO authenticated
  WITH CHECK (responsavel_id = auth.uid());

CREATE POLICY "organizacoes_update_responsavel" ON public.organizacoes
  FOR UPDATE TO authenticated
  USING (responsavel_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (responsavel_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "organizacoes_delete_responsavel" ON public.organizacoes
  FOR DELETE TO authenticated
  USING (responsavel_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ===== Policies: organizacao_membros =====
CREATE POLICY "org_membros_select" ON public.organizacao_membros
  FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR public.is_org_membro(organizacao_id, auth.uid())
    OR public.is_org_responsavel(organizacao_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "org_membros_manage_responsavel" ON public.organizacao_membros
  FOR ALL TO authenticated
  USING (
    public.is_org_responsavel(organizacao_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.is_org_responsavel(organizacao_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- ===== Policies: convites =====
CREATE POLICY "convites_manage_responsavel" ON public.convites
  FOR ALL TO authenticated
  USING (
    public.is_org_responsavel(organizacao_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    convidado_por = auth.uid()
    AND (
      public.is_org_responsavel(organizacao_id, auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    )
  );