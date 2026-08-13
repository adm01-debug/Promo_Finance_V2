ALTER TABLE public.pix_templates
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID,
  ADD COLUMN IF NOT EXISTS favorecido_nome TEXT,
  ADD COLUMN IF NOT EXISTS favorecido_cpf_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS tipo_chave_pix TEXT,
  ADD COLUMN IF NOT EXISTS valor_padrao NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_fixo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS categoria TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ultimo_uso TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Campos legados deixam de ser obrigatórios (preenchidos por trigger)
ALTER TABLE public.pix_templates
  ALTER COLUMN beneficiario_nome DROP NOT NULL,
  ALTER COLUMN cidade DROP NOT NULL,
  ALTER COLUMN tipo_chave DROP NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

UPDATE public.pix_templates
   SET favorecido_nome = COALESCE(favorecido_nome, beneficiario_nome),
       tipo_chave_pix = COALESCE(tipo_chave_pix, tipo_chave);

ALTER TABLE public.pix_templates
  ADD CONSTRAINT pix_templates_valor_padrao_nao_negativo CHECK (valor_padrao >= 0);

CREATE OR REPLACE FUNCTION public.pix_template_sync_legacy()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.favorecido_nome := COALESCE(NEW.favorecido_nome, NEW.beneficiario_nome);
  NEW.beneficiario_nome := COALESCE(NEW.beneficiario_nome, NEW.favorecido_nome);
  NEW.tipo_chave_pix := COALESCE(NEW.tipo_chave_pix, NEW.tipo_chave);
  NEW.tipo_chave := COALESCE(NEW.tipo_chave, NEW.tipo_chave_pix);
  IF NEW.favorecido_nome IS NULL OR NEW.tipo_chave_pix IS NULL THEN
    RAISE EXCEPTION 'favorecido_nome e tipo_chave_pix são obrigatórios';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pix_template_sync_legacy
  BEFORE INSERT OR UPDATE ON public.pix_templates
  FOR EACH ROW EXECUTE FUNCTION public.pix_template_sync_legacy();

CREATE TRIGGER trg_pix_templates_updated_at
  BEFORE UPDATE ON public.pix_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_pix_templates_uso ON public.pix_templates (ativo, uso_count DESC);