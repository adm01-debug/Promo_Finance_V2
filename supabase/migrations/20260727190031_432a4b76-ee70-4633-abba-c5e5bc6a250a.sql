-- ============ Faixas do Simples Nacional ============
CREATE TABLE IF NOT EXISTS public.faixas_simples_nacional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anexo text NOT NULL CHECK (anexo IN ('I','II','III','IV','V')),
  faixa smallint NOT NULL CHECK (faixa BETWEEN 1 AND 6),
  rbt12_de numeric(14,2) NOT NULL,
  rbt12_ate numeric(14,2) NOT NULL,
  aliquota numeric(8,6) NOT NULL,
  parcela_deduzir numeric(14,2) NOT NULL DEFAULT 0,
  reparticao jsonb NOT NULL DEFAULT '{}'::jsonb,
  vigente_de date NOT NULL DEFAULT '2018-01-01',
  vigente_ate date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT faixas_simples_unq UNIQUE (anexo, faixa, vigente_de),
  CONSTRAINT faixas_simples_intervalo_chk CHECK (rbt12_ate > rbt12_de),
  CONSTRAINT faixas_simples_vigencia_chk CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)
);
CREATE INDEX IF NOT EXISTS idx_faixas_simples_anexo ON public.faixas_simples_nacional (anexo, vigente_de DESC, faixa);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faixas_simples_nacional TO authenticated;
GRANT ALL ON public.faixas_simples_nacional TO service_role;
ALTER TABLE public.faixas_simples_nacional ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faixas_simples_select_authenticated" ON public.faixas_simples_nacional;
CREATE POLICY "faixas_simples_select_authenticated" ON public.faixas_simples_nacional FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "faixas_simples_write_admin" ON public.faixas_simples_nacional;
CREATE POLICY "faixas_simples_write_admin" ON public.faixas_simples_nacional FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_faixas_simples_updated_at ON public.faixas_simples_nacional;
CREATE TRIGGER trg_faixas_simples_updated_at BEFORE UPDATE ON public.faixas_simples_nacional
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Protocolos ICMS-ST ============
CREATE TABLE IF NOT EXISTS public.protocolos_st (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  segmento text,
  vigente_de date NOT NULL DEFAULT '2024-01-01',
  vigente_ate date,
  base_legal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT protocolos_st_vigencia_chk CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocolos_st TO authenticated;
GRANT ALL ON public.protocolos_st TO service_role;
ALTER TABLE public.protocolos_st ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "protocolos_st_select_authenticated" ON public.protocolos_st;
CREATE POLICY "protocolos_st_select_authenticated" ON public.protocolos_st FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "protocolos_st_write_admin" ON public.protocolos_st;
CREATE POLICY "protocolos_st_write_admin" ON public.protocolos_st FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_protocolos_st_updated_at ON public.protocolos_st;
CREATE TRIGGER trg_protocolos_st_updated_at BEFORE UPDATE ON public.protocolos_st
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.protocolos_st_ufs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id uuid NOT NULL REFERENCES public.protocolos_st(id) ON DELETE CASCADE,
  uf public.uf_brasil NOT NULL,
  papel text NOT NULL DEFAULT 'AMBOS' CHECK (papel IN ('ORIGEM','DESTINO','AMBOS')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT protocolos_st_ufs_unq UNIQUE (protocolo_id, uf)
);
CREATE INDEX IF NOT EXISTS idx_protocolos_st_ufs_protocolo ON public.protocolos_st_ufs (protocolo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocolos_st_ufs TO authenticated;
GRANT ALL ON public.protocolos_st_ufs TO service_role;
ALTER TABLE public.protocolos_st_ufs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "protocolos_st_ufs_select_authenticated" ON public.protocolos_st_ufs;
CREATE POLICY "protocolos_st_ufs_select_authenticated" ON public.protocolos_st_ufs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "protocolos_st_ufs_write_admin" ON public.protocolos_st_ufs;
CREATE POLICY "protocolos_st_ufs_write_admin" ON public.protocolos_st_ufs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_protocolos_st_ufs_updated_at ON public.protocolos_st_ufs;
CREATE TRIGGER trg_protocolos_st_ufs_updated_at BEFORE UPDATE ON public.protocolos_st_ufs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.protocolos_st_ncms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id uuid NOT NULL REFERENCES public.protocolos_st(id) ON DELETE CASCADE,
  ncm_id uuid REFERENCES public.ncms(id) ON DELETE CASCADE,
  ncm_codigo text NOT NULL,
  mva_original numeric(6,4),
  cest text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT protocolos_st_ncms_unq UNIQUE (protocolo_id, ncm_codigo)
);
CREATE INDEX IF NOT EXISTS idx_protocolos_st_ncms_protocolo ON public.protocolos_st_ncms (protocolo_id);
CREATE INDEX IF NOT EXISTS idx_protocolos_st_ncms_ncm ON public.protocolos_st_ncms (ncm_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocolos_st_ncms TO authenticated;
GRANT ALL ON public.protocolos_st_ncms TO service_role;
ALTER TABLE public.protocolos_st_ncms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "protocolos_st_ncms_select_authenticated" ON public.protocolos_st_ncms;
CREATE POLICY "protocolos_st_ncms_select_authenticated" ON public.protocolos_st_ncms FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "protocolos_st_ncms_write_admin" ON public.protocolos_st_ncms;
CREATE POLICY "protocolos_st_ncms_write_admin" ON public.protocolos_st_ncms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_protocolos_st_ncms_updated_at ON public.protocolos_st_ncms;
CREATE TRIGGER trg_protocolos_st_ncms_updated_at BEFORE UPDATE ON public.protocolos_st_ncms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Benefícios fiscais ============
CREATE TABLE IF NOT EXISTS public.beneficios_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  uf public.uf_brasil,
  tipo text NOT NULL DEFAULT 'CREDITO_PRESUMIDO',
  descricao text,
  percentual numeric(6,4),
  criterios jsonb NOT NULL DEFAULT '{}'::jsonb,
  base_legal text,
  vigente_de date NOT NULL DEFAULT '2024-01-01',
  vigente_ate date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT beneficios_fiscais_vigencia_chk CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)
);
CREATE INDEX IF NOT EXISTS idx_beneficios_uf ON public.beneficios_fiscais (uf);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficios_fiscais TO authenticated;
GRANT ALL ON public.beneficios_fiscais TO service_role;
ALTER TABLE public.beneficios_fiscais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "beneficios_select_authenticated" ON public.beneficios_fiscais;
CREATE POLICY "beneficios_select_authenticated" ON public.beneficios_fiscais FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "beneficios_write_admin" ON public.beneficios_fiscais;
CREATE POLICY "beneficios_write_admin" ON public.beneficios_fiscais FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_beneficios_updated_at ON public.beneficios_fiscais;
CREATE TRIGGER trg_beneficios_updated_at BEFORE UPDATE ON public.beneficios_fiscais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Estratégias de elisão ============
CREATE TABLE IF NOT EXISTS public.estrategias_elisao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nome text NOT NULL,
  categoria text,
  descricao text,
  regimes_aplicaveis text[] NOT NULL DEFAULT '{}',
  economia_estimada_percentual numeric(6,4),
  risco public.nivel_risco NOT NULL DEFAULT 'MEDIO',
  base_legal text,
  requisitos jsonb NOT NULL DEFAULT '{}'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_estrategias_ativo ON public.estrategias_elisao (ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estrategias_elisao TO authenticated;
GRANT ALL ON public.estrategias_elisao TO service_role;
ALTER TABLE public.estrategias_elisao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estrategias_select_authenticated" ON public.estrategias_elisao;
CREATE POLICY "estrategias_select_authenticated" ON public.estrategias_elisao FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "estrategias_write_admin" ON public.estrategias_elisao;
CREATE POLICY "estrategias_write_admin" ON public.estrategias_elisao FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_estrategias_updated_at ON public.estrategias_elisao;
CREATE TRIGGER trg_estrategias_updated_at BEFORE UPDATE ON public.estrategias_elisao
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';