
DO $$
DECLARE
  t text;
  sensitive_tables text[] := ARRAY[
    'audit_logs',
    'auth_logs',
    'blocked_ips',
    'frontend_error_logs',
    'ip_whitelist',
    'login_attempts',
    'password_reset_tokens',
    'profiles',
    'security_audit_logs',
    'sso_login_attempts',
    'user_roles',
    'user_sessions',
    'webhook_dlq',
    'webhooks_log'
  ];
BEGIN
  FOREACH t IN ARRAY sensitive_tables LOOP
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
