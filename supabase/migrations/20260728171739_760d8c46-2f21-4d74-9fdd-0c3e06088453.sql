-- Cofres de credenciais: remover TODO privilégio de anon (defesa em profundidade,
-- somada à RLS que já nega acesso).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bitrix24_tokens') THEN
    REVOKE ALL ON public.bitrix24_tokens FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_keys') THEN
    REVOKE ALL ON public.api_keys FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empresas_certificados') THEN
    REVOKE ALL ON public.empresas_certificados FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens') THEN
    REVOKE ALL ON public.password_reset_tokens FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portal_cliente_tokens') THEN
    REVOKE ALL ON public.portal_cliente_tokens FROM anon;
  END IF;
END;
$$;

-- Alinhar GRANTs de authenticated às políticas realmente existentes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_keys') THEN
    REVOKE INSERT, UPDATE ON public.api_keys FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens') THEN
    REVOKE UPDATE ON public.password_reset_tokens FROM authenticated;
  END IF;
END;
$$;

-- Garantir que os processos internos continuam com acesso total.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bitrix24_tokens') THEN
    GRANT ALL ON public.bitrix24_tokens TO service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_keys') THEN
    GRANT ALL ON public.api_keys TO service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empresas_certificados') THEN
    GRANT ALL ON public.empresas_certificados TO service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens') THEN
    GRANT ALL ON public.password_reset_tokens TO service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'portal_cliente_tokens') THEN
    GRANT ALL ON public.portal_cliente_tokens TO service_role;
  END IF;
END;
$$;
