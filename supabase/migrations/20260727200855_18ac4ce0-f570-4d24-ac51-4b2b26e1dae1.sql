-- Vigência temporal dos catálogos fiscais (NCM/TIPI e lista de serviços LC 116)
ALTER TABLE public.ncms
  ADD COLUMN IF NOT EXISTS vigente_de DATE NOT NULL DEFAULT '2022-01-01',
  ADD COLUMN IF NOT EXISTS vigente_ate DATE;

ALTER TABLE public.itens_lista_iss
  ADD COLUMN IF NOT EXISTS vigente_de DATE NOT NULL DEFAULT '2004-01-01',
  ADD COLUMN IF NOT EXISTS vigente_ate DATE;

-- Período coerente: data final, quando informada, não pode preceder a inicial.
ALTER TABLE public.ncms
  DROP CONSTRAINT IF EXISTS ncms_vigencia_coerente;
ALTER TABLE public.ncms
  ADD CONSTRAINT ncms_vigencia_coerente
  CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de);

ALTER TABLE public.itens_lista_iss
  DROP CONSTRAINT IF EXISTS itens_lista_iss_vigencia_coerente;
ALTER TABLE public.itens_lista_iss
  ADD CONSTRAINT itens_lista_iss_vigencia_coerente
  CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de);

CREATE INDEX IF NOT EXISTS idx_ncms_vigencia ON public.ncms (vigente_de, vigente_ate);
CREATE INDEX IF NOT EXISTS idx_itens_lista_iss_vigencia ON public.itens_lista_iss (vigente_de, vigente_ate);

COMMENT ON COLUMN public.ncms.vigente_de IS 'Início de vigência do registro (TIPI - Decreto 11.158/2022 como marco padrão)';
COMMENT ON COLUMN public.ncms.vigente_ate IS 'Fim de vigência; NULL = vigente por prazo indeterminado';
COMMENT ON COLUMN public.itens_lista_iss.vigente_de IS 'Início de vigência do item da lista da LC 116/2003';
COMMENT ON COLUMN public.itens_lista_iss.vigente_ate IS 'Fim de vigência; NULL = vigente por prazo indeterminado';