ALTER TABLE public.ufs
  ADD COLUMN IF NOT EXISTS vigente_de date NOT NULL DEFAULT '2000-01-01',
  ADD COLUMN IF NOT EXISTS vigente_ate date;

ALTER TABLE public.protocolos_st_ncms
  ADD COLUMN IF NOT EXISTS vigente_de date NOT NULL DEFAULT '2000-01-01',
  ADD COLUMN IF NOT EXISTS vigente_ate date;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ufs_vigencia_coerente') THEN
    ALTER TABLE public.ufs
      ADD CONSTRAINT ufs_vigencia_coerente
      CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocolos_st_ncms_vigencia_coerente') THEN
    ALTER TABLE public.protocolos_st_ncms
      ADD CONSTRAINT protocolos_st_ncms_vigencia_coerente
      CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ufs_vigencia ON public.ufs (vigente_de, vigente_ate);
CREATE INDEX IF NOT EXISTS idx_protocolos_st_ncms_vigencia ON public.protocolos_st_ncms (vigente_de, vigente_ate);
CREATE INDEX IF NOT EXISTS idx_ncms_vigencia ON public.ncms (vigente_de, vigente_ate);
CREATE INDEX IF NOT EXISTS idx_itens_lista_iss_vigencia ON public.itens_lista_iss (vigente_de, vigente_ate);
CREATE INDEX IF NOT EXISTS idx_aliquotas_iss_municipal_vigencia ON public.aliquotas_iss_municipal (vigente_de, vigente_ate);