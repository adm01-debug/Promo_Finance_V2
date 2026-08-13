-- Item 26: Timeouts defensivos por role (defense-in-depth contra long-running queries e conn leaks)

-- Roles do frontend (curto e agressivo)
ALTER ROLE anon           SET statement_timeout = '8s';
ALTER ROLE anon           SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE anon           SET lock_timeout = '3s';

ALTER ROLE authenticated  SET statement_timeout = '8s';
ALTER ROLE authenticated  SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE authenticated  SET lock_timeout = '3s';

ALTER ROLE authenticator  SET statement_timeout = '8s';
ALTER ROLE authenticator  SET idle_in_transaction_session_timeout = '10s';
ALTER ROLE authenticator  SET lock_timeout = '3s';

-- Service role (jobs administrativos, Edge Functions, migrations manuais)
ALTER ROLE service_role   SET statement_timeout = '60s';
ALTER ROLE service_role   SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE service_role   SET lock_timeout = '10s';

-- Auditoria
INSERT INTO public.audit_logs (table_name, action, details, created_at)
VALUES ('pg_roles', 'configure_defensive_timeouts',
        'Item 26: statement_timeout, idle_in_transaction_session_timeout e lock_timeout aplicados a anon/authenticated/authenticator/service_role',
        now());