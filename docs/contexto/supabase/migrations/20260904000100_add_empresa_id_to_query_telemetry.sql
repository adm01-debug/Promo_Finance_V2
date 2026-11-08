ALTER TABLE public.query_telemetry
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_query_telemetry_empresa_id
  ON public.query_telemetry (empresa_id);
