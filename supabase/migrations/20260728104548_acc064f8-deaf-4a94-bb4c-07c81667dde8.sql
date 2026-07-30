-- integration_secrets: deny-by-default made explicit + hard revoke of API roles
REVOKE ALL ON TABLE public.integration_secrets FROM anon, authenticated;
GRANT ALL ON TABLE public.integration_secrets TO service_role;

DROP POLICY IF EXISTS "integration_secrets_no_client_access" ON public.integration_secrets;
CREATE POLICY "integration_secrets_no_client_access"
  ON public.integration_secrets
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.integration_secrets IS
  'Segredos de integracao. Acesso exclusivo de service_role (edge functions). Clientes anon/authenticated bloqueados por RLS restritiva e ausencia de GRANT.';

DO $$
DECLARE v_bad int;
BEGIN
  SELECT count(*) INTO v_bad
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'integration_secrets'
    AND grantee IN ('anon', 'authenticated');
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'integration_secrets ainda possui % grants para roles publicas', v_bad;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'integration_secrets' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS desabilitada em integration_secrets';
  END IF;
END $$;