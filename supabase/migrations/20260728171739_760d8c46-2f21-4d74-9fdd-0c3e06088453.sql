-- Cofres de credenciais: remover TODO privilégio de anon (defesa em profundidade,
-- somada à RLS que já nega acesso).

-- bitrix24_tokens: pode não existir em Preview (sem CREATE TABLE na history)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'bitrix24_tokens') THEN
    REVOKE ALL ON public.bitrix24_tokens FROM anon;
  END IF;
END $$;

REVOKE ALL ON public.api_keys FROM anon;
REVOKE ALL ON public.empresas_certificados FROM anon;

-- password_reset_tokens: pode não existir em Preview (sem CREATE TABLE na history)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'password_reset_tokens') THEN
    REVOKE ALL ON public.password_reset_tokens FROM anon;
  END IF;
END $$;

REVOKE ALL ON public.portal_cliente_tokens FROM anon;

-- Alinhar GRANTs de authenticated às políticas realmente existentes.
-- api_keys: só existem policies de SELECT e DELETE (criação é feita por edge
-- function com service_role, que grava apenas o hash da chave).
REVOKE INSERT, UPDATE ON public.api_keys FROM authenticated;

-- password_reset_tokens: existem policies de INSERT, SELECT e DELETE.
-- UPDATE nunca deve ser permitido (token é imutável após emissão).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'password_reset_tokens') THEN
    REVOKE UPDATE ON public.password_reset_tokens FROM authenticated;
  END IF;
END $$;

-- Garantir que os processos internos continuam com acesso total.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'bitrix24_tokens') THEN
    GRANT ALL ON public.bitrix24_tokens TO service_role;
  END IF;
END $$;

GRANT ALL ON public.api_keys TO service_role;
GRANT ALL ON public.empresas_certificados TO service_role;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'password_reset_tokens') THEN
    GRANT ALL ON public.password_reset_tokens TO service_role;
  END IF;
END $$;

GRANT ALL ON public.portal_cliente_tokens TO service_role;
