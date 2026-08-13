
-- Item 31: Endurecer SECURITY DEFINER — revogar EXECUTE de PUBLIC/anon
-- Defense-in-depth: apenas 'authenticated' mantém acesso onde legítimo.
-- resolve_sso_providers_for_domain permanece acessível a anon (SSO pre-login).

DO $$
DECLARE
  r RECORD;
  sig TEXT;
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef = true
       AND p.proname <> 'resolve_sso_providers_for_domain'
  LOOP
    sig := format('public.%I(%s)', r.proname, r.args);
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', sig);
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', sig);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skip %: %', sig, SQLERRM;
    END;
  END LOOP;
END $$;

-- Registrar auditoria
INSERT INTO public.audit_logs (table_name, action, details, created_at)
VALUES ('pg_proc', 'security_definer_hardened',
        'Item 31: revogado EXECUTE de PUBLIC/anon em funções SECURITY DEFINER (exceto resolve_sso_providers_for_domain).',
        now());
