-- ============ 1) SPED (ECD/ECF) ============
CREATE TABLE IF NOT EXISTS public.sped_contabil_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ECD','ECF')),
  ano_calendario INTEGER NOT NULL CHECK (ano_calendario BETWEEN 2000 AND 2100),
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  storage_path TEXT NOT NULL,
  hash_sha256 TEXT,
  total_linhas INTEGER NOT NULL DEFAULT 0 CHECK (total_linhas >= 0),
  total_lancamentos INTEGER NOT NULL DEFAULT 0 CHECK (total_lancamentos >= 0),
  validacoes JSONB NOT NULL DEFAULT '{"erros":[],"avisos":[]}'::jsonb,
  status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado','rejeitado','transmitido','cancelado')),
  recibo_transmissao TEXT,
  transmitido_em TIMESTAMPTZ,
  gerado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sped_periodo_valido CHECK (periodo_fim >= periodo_inicio)
);

CREATE INDEX IF NOT EXISTS idx_sped_arq_empresa_tipo_ano
  ON public.sped_contabil_arquivos (empresa_id, tipo, ano_calendario, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sped_contabil_arquivos TO authenticated;
GRANT ALL ON public.sped_contabil_arquivos TO service_role;
ALTER TABLE public.sped_contabil_arquivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sped_arquivos_select" ON public.sped_contabil_arquivos
  FOR SELECT TO authenticated USING (public.empresa_acessivel(empresa_id));
CREATE POLICY "sped_arquivos_insert" ON public.sped_contabil_arquivos
  FOR INSERT TO authenticated WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE POLICY "sped_arquivos_update_admin" ON public.sped_contabil_arquivos
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel(empresa_id))
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel(empresa_id));
CREATE POLICY "sped_arquivos_delete_admin" ON public.sped_contabil_arquivos
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND public.empresa_acessivel(empresa_id));

CREATE TRIGGER trg_sped_arquivos_updated_at
  BEFORE UPDATE ON public.sped_contabil_arquivos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ 2) Cache CNPJá ============
CREATE TABLE IF NOT EXISTS public.cnpja_cache (
  cnpj TEXT NOT NULL PRIMARY KEY CHECK (cnpj ~ '^[0-9]{14}$'),
  data JSONB NOT NULL,
  situacao_cadastral TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cnpja_cache_validade CHECK (expires_at > fetched_at)
);

CREATE INDEX IF NOT EXISTS idx_cnpja_cache_expires ON public.cnpja_cache (expires_at DESC);

GRANT SELECT ON public.cnpja_cache TO authenticated;
GRANT ALL ON public.cnpja_cache TO service_role;
ALTER TABLE public.cnpja_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cnpja_cache_select" ON public.cnpja_cache
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_cnpja_cache_updated_at
  BEFORE UPDATE ON public.cnpja_cache
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ 3) Checklist SCIM ============
CREATE TABLE IF NOT EXISTS public.scim_setup_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_key TEXT NOT NULL CHECK (char_length(item_key) BETWEEN 1 AND 120),
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scim_checklist_unico UNIQUE (user_id, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scim_setup_checklist TO authenticated;
GRANT ALL ON public.scim_setup_checklist TO service_role;
ALTER TABLE public.scim_setup_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scim_checklist_own" ON public.scim_setup_checklist
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_scim_checklist_updated_at
  BEFORE UPDATE ON public.scim_setup_checklist
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ 4) Contador de uso dos templates PIX ============
ALTER TABLE public.pix_templates
  ADD COLUMN IF NOT EXISTS uso_count INTEGER NOT NULL DEFAULT 0 CHECK (uso_count >= 0);

CREATE OR REPLACE FUNCTION public.increment_pix_template_uso(p_template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.pix_templates
     SET uso_count = COALESCE(uso_count, 0) + 1
   WHERE id = p_template_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_pix_template_uso(UUID) TO authenticated;