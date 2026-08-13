-- ============ UFs ============
CREATE TABLE IF NOT EXISTS public.ufs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla public.uf_brasil NOT NULL UNIQUE,
  nome text NOT NULL,
  codigo_ibge integer NOT NULL,
  regiao public.regiao_brasil NOT NULL,
  aliquota_interna_padrao numeric(6,4) NOT NULL DEFAULT 0.18,
  possui_fcp boolean NOT NULL DEFAULT false,
  aliquota_fcp numeric(6,4) NOT NULL DEFAULT 0,
  exige_antecipacao boolean NOT NULL DEFAULT false,
  difal_base_dupla boolean NOT NULL DEFAULT false,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ufs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ufs TO authenticated;
GRANT ALL ON public.ufs TO service_role;
ALTER TABLE public.ufs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ufs_select_authenticated" ON public.ufs;
CREATE POLICY "ufs_select_authenticated" ON public.ufs
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ufs_write_admin" ON public.ufs;
CREATE POLICY "ufs_write_admin" ON public.ufs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_ufs_updated_at ON public.ufs;
CREATE TRIGGER trg_ufs_updated_at BEFORE UPDATE ON public.ufs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Alíquotas interestaduais ============
CREATE TABLE IF NOT EXISTS public.aliquotas_interestaduais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uf_origem public.uf_brasil NOT NULL,
  uf_destino public.uf_brasil NOT NULL,
  aliquota numeric(6,4) NOT NULL,
  aliquota_importado numeric(6,4) NOT NULL DEFAULT 0.04,
  vigente_de date NOT NULL DEFAULT '2016-01-01',
  vigente_ate date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aliquotas_interestaduais_unq UNIQUE (uf_origem, uf_destino, vigente_de),
  CONSTRAINT aliquotas_interestaduais_vigencia_chk CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)
);

CREATE INDEX IF NOT EXISTS idx_aliq_inter_origem_destino
  ON public.aliquotas_interestaduais (uf_origem, uf_destino, vigente_de DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aliquotas_interestaduais TO authenticated;
GRANT ALL ON public.aliquotas_interestaduais TO service_role;
ALTER TABLE public.aliquotas_interestaduais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aliq_inter_select_authenticated" ON public.aliquotas_interestaduais;
CREATE POLICY "aliq_inter_select_authenticated" ON public.aliquotas_interestaduais
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "aliq_inter_write_admin" ON public.aliquotas_interestaduais;
CREATE POLICY "aliq_inter_write_admin" ON public.aliquotas_interestaduais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_aliq_inter_updated_at ON public.aliquotas_interestaduais;
CREATE TRIGGER trg_aliq_inter_updated_at BEFORE UPDATE ON public.aliquotas_interestaduais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Alíquotas internas por UF/categoria ============
CREATE TABLE IF NOT EXISTS public.aliquotas_internas_uf (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uf public.uf_brasil NOT NULL,
  categoria_produto text NOT NULL DEFAULT 'GERAL',
  aliquota numeric(6,4) NOT NULL,
  aliquota_fcp numeric(6,4) NOT NULL DEFAULT 0,
  base_legal text,
  vigente_de date NOT NULL DEFAULT '2024-01-01',
  vigente_ate date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aliquotas_internas_uf_unq UNIQUE (uf, categoria_produto, vigente_de),
  CONSTRAINT aliquotas_internas_uf_vigencia_chk CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)
);

CREATE INDEX IF NOT EXISTS idx_aliq_internas_uf_cat
  ON public.aliquotas_internas_uf (uf, categoria_produto, vigente_de DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aliquotas_internas_uf TO authenticated;
GRANT ALL ON public.aliquotas_internas_uf TO service_role;
ALTER TABLE public.aliquotas_internas_uf ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aliq_internas_select_authenticated" ON public.aliquotas_internas_uf;
CREATE POLICY "aliq_internas_select_authenticated" ON public.aliquotas_internas_uf
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "aliq_internas_write_admin" ON public.aliquotas_internas_uf;
CREATE POLICY "aliq_internas_write_admin" ON public.aliquotas_internas_uf
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_aliq_internas_updated_at ON public.aliquotas_internas_uf;
CREATE TRIGGER trg_aliq_internas_updated_at BEFORE UPDATE ON public.aliquotas_internas_uf
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';