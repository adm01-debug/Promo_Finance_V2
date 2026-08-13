ALTER TABLE public.metas_financeiras
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_metas_financeiras_ativo
  ON public.metas_financeiras (ativo) WHERE ativo = true;