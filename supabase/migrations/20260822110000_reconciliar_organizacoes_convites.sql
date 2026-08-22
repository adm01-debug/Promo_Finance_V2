-- Reconciliação do banco canônico: organizações e convites.
DO $$ BEGIN
  CREATE TYPE public.org_papel AS ENUM ('RESPONSAVEL', 'ADMIN', 'MEMBRO', 'LEITOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.organizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('ESCRITORIO_CONTABIL', 'EMPRESA', 'CONSULTORIA', 'OUTRO')),
  responsavel_id uuid NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- O ambiente canônico de testes pode conter uma criação parcial antiga,
-- sem as duas colunas exigidas pelo contrato atual da aplicação.
ALTER TABLE public.organizacoes
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'OUTRO',
  ADD COLUMN IF NOT EXISTS responsavel_id uuid;

ALTER TABLE public.organizacoes
  DROP CONSTRAINT IF EXISTS organizacoes_tipo_check;
ALTER TABLE public.organizacoes
  ADD CONSTRAINT organizacoes_tipo_check
  CHECK (tipo IN ('ESCRITORIO_CONTABIL', 'EMPRESA', 'CONSULTORIA', 'OUTRO'));

ALTER TABLE public.organizacoes
  ALTER COLUMN responsavel_id SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.organizacao_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL,
  papel_na_org public.org_papel NOT NULL DEFAULT 'MEMBRO',
  ativo boolean NOT NULL DEFAULT true,
  convidado_por uuid,
  aceito_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_org_membro UNIQUE (organizacao_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS public.convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  email_convidado text NOT NULL,
  papel_proposto public.org_papel NOT NULL DEFAULT 'MEMBRO',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expira_em timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  utilizado_em timestamptz,
  convidado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_org_membro(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizacao_membros WHERE organizacao_id = _org_id AND usuario_id = _user_id AND ativo)
$$;

CREATE OR REPLACE FUNCTION public.is_org_responsavel(_org_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizacoes WHERE id = _org_id AND responsavel_id = _user_id)
$$;

REVOKE ALL ON FUNCTION public.is_org_membro(uuid, uuid), public.is_org_responsavel(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_membro(uuid, uuid), public.is_org_responsavel(uuid, uuid) TO authenticated, service_role;

ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizacao_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizacoes, public.organizacao_membros, public.convites TO authenticated;
GRANT ALL ON public.organizacoes, public.organizacao_membros, public.convites TO service_role;

DROP POLICY IF EXISTS "organizacoes_select_membro_ou_admin" ON public.organizacoes;
CREATE POLICY "organizacoes_select_membro_ou_admin" ON public.organizacoes FOR SELECT TO authenticated
  USING (responsavel_id = auth.uid() OR public.is_org_membro(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "organizacoes_insert_proprio" ON public.organizacoes;
CREATE POLICY "organizacoes_insert_proprio" ON public.organizacoes FOR INSERT TO authenticated WITH CHECK (responsavel_id = auth.uid());
DROP POLICY IF EXISTS "organizacoes_update_responsavel" ON public.organizacoes;
CREATE POLICY "organizacoes_update_responsavel" ON public.organizacoes FOR UPDATE TO authenticated
  USING (responsavel_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (responsavel_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "organizacoes_delete_responsavel" ON public.organizacoes;
CREATE POLICY "organizacoes_delete_responsavel" ON public.organizacoes FOR DELETE TO authenticated
  USING (responsavel_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "org_membros_select" ON public.organizacao_membros;
CREATE POLICY "org_membros_select" ON public.organizacao_membros FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR public.is_org_membro(organizacao_id, auth.uid()) OR public.is_org_responsavel(organizacao_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "org_membros_manage_responsavel" ON public.organizacao_membros;
CREATE POLICY "org_membros_manage_responsavel" ON public.organizacao_membros FOR ALL TO authenticated
  USING (public.is_org_responsavel(organizacao_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_org_responsavel(organizacao_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "convites_manage_responsavel" ON public.convites;
CREATE POLICY "convites_manage_responsavel" ON public.convites FOR ALL TO authenticated
  USING (public.is_org_responsavel(organizacao_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (convidado_por = auth.uid() AND (public.is_org_responsavel(organizacao_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')));

CREATE INDEX IF NOT EXISTS idx_organizacoes_responsavel ON public.organizacoes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_org_membros_usuario ON public.organizacao_membros(usuario_id) WHERE ativo;
CREATE INDEX IF NOT EXISTS idx_org_membros_org ON public.organizacao_membros(organizacao_id) WHERE ativo;
CREATE INDEX IF NOT EXISTS idx_convites_email ON public.convites(email_convidado) WHERE utilizado_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_convites_token ON public.convites(token) WHERE utilizado_em IS NULL;

DROP TRIGGER IF EXISTS trg_organizacoes_updated_at ON public.organizacoes;
CREATE TRIGGER trg_organizacoes_updated_at BEFORE UPDATE ON public.organizacoes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS trg_org_membros_updated_at ON public.organizacao_membros;
CREATE TRIGGER trg_org_membros_updated_at BEFORE UPDATE ON public.organizacao_membros FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

NOTIFY pgrst, 'reload schema';
