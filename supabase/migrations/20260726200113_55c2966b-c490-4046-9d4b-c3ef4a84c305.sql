ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS cnae_principal text,
  ADD COLUMN IF NOT EXISTS codigo_fpas text,
  ADD COLUMN IF NOT EXISTS aliquota_rat numeric(5,4),
  ADD COLUMN IF NOT EXISTS aliquota_terceiros numeric(5,4);

ALTER TABLE public.empresas
  DROP CONSTRAINT IF EXISTS empresas_aliquota_rat_range;
ALTER TABLE public.empresas
  ADD CONSTRAINT empresas_aliquota_rat_range
  CHECK (aliquota_rat IS NULL OR (aliquota_rat >= 0 AND aliquota_rat <= 0.06));

ALTER TABLE public.empresas
  DROP CONSTRAINT IF EXISTS empresas_aliquota_terceiros_range;
ALTER TABLE public.empresas
  ADD CONSTRAINT empresas_aliquota_terceiros_range
  CHECK (aliquota_terceiros IS NULL OR (aliquota_terceiros >= 0 AND aliquota_terceiros <= 0.08));

ALTER TABLE public.empresas
  DROP CONSTRAINT IF EXISTS empresas_cnae_principal_formato;
ALTER TABLE public.empresas
  ADD CONSTRAINT empresas_cnae_principal_formato
  CHECK (cnae_principal IS NULL OR length(regexp_replace(cnae_principal, '\D', '', 'g')) BETWEEN 2 AND 7);

COMMENT ON COLUMN public.empresas.cnae_principal IS 'CNAE principal; deriva FPAS e alíquota de terceiros na folha.';
COMMENT ON COLUMN public.empresas.codigo_fpas IS 'Código FPAS (IN RFB 2.110/2022) quando informado manualmente.';
COMMENT ON COLUMN public.empresas.aliquota_rat IS 'RAT x FAP em fração (0 a 0.06).';
COMMENT ON COLUMN public.empresas.aliquota_terceiros IS 'Contribuições a terceiros em fração (0 a 0.08); NULL = derivar do CNAE.';