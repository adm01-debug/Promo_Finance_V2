
DO $$
DECLARE
  r RECORD;
  v_keep TEXT[] := ARRAY[
    'increment_failed_attempts',
    'reset_failed_attempts',
    'get_lockout_details',
    'is_country_allowed_for_login',
    'is_ip_allowed_for_login',
    'log_sso_onboarding_event',
    'check_login_lockout',
    'check_login_lockout_v2',
    'record_failed_login',
    'record_failed_login_v2',
    'is_ip_blocked',
    'is_country_blocked',
    'is_ip_whitelisted',
    'clear_login_attempts'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname, p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND NOT (p.proname = ANY(v_keep))
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon;',
                   r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role;',
                   r.proname, r.args);
  END LOOP;
END $$;
