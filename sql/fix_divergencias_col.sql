-- Padroniza divergencias_conciliacao para usar 'resolvido' (masculino) conforme o frontend

ALTER TABLE public.divergencias_conciliacao
  DROP COLUMN IF EXISTS resolvida;

-- Coluna padronizada: resolvido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='divergencias_conciliacao' AND column_name='resolvido'
  ) THEN
    ALTER TABLE public.divergencias_conciliacao ADD COLUMN resolvido boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_divergencias_resolvido
  ON public.divergencias_conciliacao(resolvido)
  WHERE resolvido = false;

NOTIFY pgrst, 'reload schema';
