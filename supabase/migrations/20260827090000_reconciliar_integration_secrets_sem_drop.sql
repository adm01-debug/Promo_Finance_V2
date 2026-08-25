-- Reconciliação aditiva de integration_secrets.
-- Não remove tabelas, colunas, policies, dados ou funções existentes.

DO $$
BEGIN
  IF to_regclass('public.integration_secrets') IS NULL THEN
    RAISE EXCEPTION 'Tabela public.integration_secrets ausente; interrompendo sem criar estrutura divergente';
  END IF;
END
$$;

ALTER TABLE public.integration_secrets
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS chave text,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.integration_secrets
SET chave = COALESCE(NULLIF(btrim(chave), ''), NULLIF(btrim(nome), '')),
    nome = COALESCE(NULLIF(btrim(nome), ''), NULLIF(btrim(chave), ''))
WHERE chave IS NULL OR btrim(chave) = '' OR nome IS NULL OR btrim(nome) = '';

CREATE OR REPLACE FUNCTION public.sync_integration_secret_identifier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.chave := COALESCE(NULLIF(btrim(NEW.chave), ''), NULLIF(btrim(NEW.nome), ''));
  NEW.nome := COALESCE(NULLIF(btrim(NEW.nome), ''), NEW.chave);

  IF NEW.chave IS NULL OR NEW.nome IS NULL THEN
    RAISE EXCEPTION 'integration_secrets exige chave ou nome não vazio'
      USING ERRCODE = '23502';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.integration_secrets'::regclass
      AND tgname = 'trg_sync_integration_secret_identifier'
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER trg_sync_integration_secret_identifier
      BEFORE INSERT OR UPDATE OF nome, chave
      ON public.integration_secrets
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_integration_secret_identifier();
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_integration_secrets_chave
  ON public.integration_secrets (chave);

COMMENT ON FUNCTION public.sync_integration_secret_identifier()
IS 'Mantém compatibilidade aditiva entre os identificadores legado nome e canônico chave.';

REVOKE ALL ON FUNCTION public.sync_integration_secret_identifier() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_integration_secret_identifier() TO service_role;
