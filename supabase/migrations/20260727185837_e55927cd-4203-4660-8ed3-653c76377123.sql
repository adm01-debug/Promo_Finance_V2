-- ============ CNAEs ============
CREATE TABLE IF NOT EXISTS public.cnaes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descricao text NOT NULL,
  anexo_simples text CHECK (anexo_simples IN ('I','II','III','IV','V')),
  sujeito_fator_r boolean NOT NULL DEFAULT false,
  vedado_simples boolean NOT NULL DEFAULT false,
  presuncao_irpj numeric(6,4) NOT NULL DEFAULT 0.08,
  presuncao_csll numeric(6,4) NOT NULL DEFAULT 0.12,
  rat_padrao numeric(6,4) NOT NULL DEFAULT 0.02,
  terceiros_padrao numeric(6,4) NOT NULL DEFAULT 0.058,
  atividade public.atividade_economica,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cnaes_anexo ON public.cnaes (anexo_simples);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cnaes TO authenticated;
GRANT ALL ON public.cnaes TO service_role;
ALTER TABLE public.cnaes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cnaes_select_authenticated" ON public.cnaes;
CREATE POLICY "cnaes_select_authenticated" ON public.cnaes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cnaes_write_admin" ON public.cnaes;
CREATE POLICY "cnaes_write_admin" ON public.cnaes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_cnaes_updated_at ON public.cnaes;
CREATE TRIGGER trg_cnaes_updated_at BEFORE UPDATE ON public.cnaes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ NCMs ============
CREATE TABLE IF NOT EXISTS public.ncms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descricao text NOT NULL,
  aliquota_ipi numeric(6,4) NOT NULL DEFAULT 0,
  cest text,
  monofasico_pis_cofins boolean NOT NULL DEFAULT false,
  sujeito_st boolean NOT NULL DEFAULT false,
  mva_padrao numeric(6,4),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ncms_st ON public.ncms (sujeito_st);
CREATE INDEX IF NOT EXISTS idx_ncms_mono ON public.ncms (monofasico_pis_cofins);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ncms TO authenticated;
GRANT ALL ON public.ncms TO service_role;
ALTER TABLE public.ncms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ncms_select_authenticated" ON public.ncms;
CREATE POLICY "ncms_select_authenticated" ON public.ncms FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ncms_write_admin" ON public.ncms;
CREATE POLICY "ncms_write_admin" ON public.ncms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_ncms_updated_at ON public.ncms;
CREATE TRIGGER trg_ncms_updated_at BEFORE UPDATE ON public.ncms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Itens da lista de serviços (LC 116/2003) ============
CREATE TABLE IF NOT EXISTS public.itens_lista_iss (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descricao text NOT NULL,
  retem_no_tomador boolean NOT NULL DEFAULT false,
  aliquota_minima numeric(6,4) NOT NULL DEFAULT 0.02,
  aliquota_maxima numeric(6,4) NOT NULL DEFAULT 0.05,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_lista_iss TO authenticated;
GRANT ALL ON public.itens_lista_iss TO service_role;
ALTER TABLE public.itens_lista_iss ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "itens_iss_select_authenticated" ON public.itens_lista_iss;
CREATE POLICY "itens_iss_select_authenticated" ON public.itens_lista_iss FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "itens_iss_write_admin" ON public.itens_lista_iss;
CREATE POLICY "itens_iss_write_admin" ON public.itens_lista_iss FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_itens_iss_updated_at ON public.itens_lista_iss;
CREATE TRIGGER trg_itens_iss_updated_at BEFORE UPDATE ON public.itens_lista_iss
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Alíquotas de ISS municipais ============
CREATE TABLE IF NOT EXISTS public.aliquotas_iss_municipal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_ibge integer NOT NULL,
  municipio text NOT NULL,
  uf public.uf_brasil NOT NULL,
  item_lista_id uuid REFERENCES public.itens_lista_iss(id) ON DELETE CASCADE,
  aliquota numeric(6,4) NOT NULL,
  vigente_de date NOT NULL DEFAULT '2024-01-01',
  vigente_ate date,
  base_legal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aliq_iss_mun_unq UNIQUE (codigo_ibge, item_lista_id, vigente_de),
  CONSTRAINT aliq_iss_mun_vigencia_chk CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)
);
CREATE INDEX IF NOT EXISTS idx_aliq_iss_item ON public.aliquotas_iss_municipal (item_lista_id);
CREATE INDEX IF NOT EXISTS idx_aliq_iss_mun ON public.aliquotas_iss_municipal (codigo_ibge, vigente_de DESC);
CREATE INDEX IF NOT EXISTS idx_aliq_iss_uf ON public.aliquotas_iss_municipal (uf);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aliquotas_iss_municipal TO authenticated;
GRANT ALL ON public.aliquotas_iss_municipal TO service_role;
ALTER TABLE public.aliquotas_iss_municipal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aliq_iss_select_authenticated" ON public.aliquotas_iss_municipal;
CREATE POLICY "aliq_iss_select_authenticated" ON public.aliquotas_iss_municipal FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "aliq_iss_write_admin" ON public.aliquotas_iss_municipal;
CREATE POLICY "aliq_iss_write_admin" ON public.aliquotas_iss_municipal FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_aliq_iss_updated_at ON public.aliquotas_iss_municipal;
CREATE TRIGGER trg_aliq_iss_updated_at BEFORE UPDATE ON public.aliquotas_iss_municipal
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';