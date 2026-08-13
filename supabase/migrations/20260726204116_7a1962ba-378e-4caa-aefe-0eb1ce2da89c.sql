ALTER TABLE public.regimes_simulados
  ADD COLUMN IF NOT EXISTS ajustes_aplicados jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.regimes_simulados.ajustes_aplicados IS
  'Trilha de auditoria: ajustes automaticos de sanitizacao aplicados aos parametros informados no momento da simulacao.';

CREATE INDEX IF NOT EXISTS idx_regimes_simulados_ajustes_aplicados
  ON public.regimes_simulados USING gin (ajustes_aplicados);