-- Remove exposição da materialized view na API
REVOKE ALL ON public.mv_benchmark_setorial FROM anon, authenticated;
GRANT SELECT ON public.mv_benchmark_setorial TO service_role;

-- Catálogo de referência setorial
CREATE TABLE IF NOT EXISTS public.benchmarks_setoriais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setor TEXT NOT NULL CHECK (char_length(setor) BETWEEN 2 AND 160),
  cnae_prefix TEXT NOT NULL CHECK (cnae_prefix ~ '^[0-9]{2,7}$'),
  regime TEXT NOT NULL CHECK (regime IN ('simples_nacional','lucro_presumido','lucro_real','mei','arbitrado')),
  carga_media_pct NUMERIC(6,3) NOT NULL CHECK (carga_media_pct >= 0 AND carga_media_pct <= 100),
  carga_p25_pct NUMERIC(6,3) CHECK (carga_p25_pct IS NULL OR (carga_p25_pct >= 0 AND carga_p25_pct <= 100)),
  carga_p75_pct NUMERIC(6,3) CHECK (carga_p75_pct IS NULL OR (carga_p75_pct >= 0 AND carga_p75_pct <= 100)),
  fonte TEXT,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT benchmark_unico UNIQUE (cnae_prefix, regime, vigencia_inicio),
  CONSTRAINT benchmark_vigencia_valida CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio),
  CONSTRAINT benchmark_percentis_coerentes CHECK (
    carga_p25_pct IS NULL OR carga_p75_pct IS NULL OR carga_p75_pct >= carga_p25_pct
  )
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON public.benchmarks_setoriais (regime, cnae_prefix);

GRANT SELECT ON public.benchmarks_setoriais TO authenticated;
GRANT ALL ON public.benchmarks_setoriais TO service_role;
ALTER TABLE public.benchmarks_setoriais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "benchmarks_select" ON public.benchmarks_setoriais
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "benchmarks_admin_write" ON public.benchmarks_setoriais
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_benchmarks_updated_at
  BEFORE UPDATE ON public.benchmarks_setoriais
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();