-- Shim: cria tabelas de segurança antes de 20260711164724
-- que faz FORCE ROW LEVEL SECURITY em todas (42P01 — ip_whitelist not exist)
-- Tabelas criadas fora do sistema de migrations em produção; Preview não as tem.
CREATE TABLE IF NOT EXISTS public.ip_whitelist (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  ip_address       inet        NOT NULL,
  cidr_range       text,
  description      text        NOT NULL DEFAULT '',
  added_by         uuid,
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  CONSTRAINT ip_whitelist_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  email            text        NOT NULL,
  ip_address       inet,
  attempt_count    integer     NOT NULL DEFAULT 1,
  first_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at  timestamptz NOT NULL DEFAULT now(),
  locked_until     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  user_agent       text,
  is_suspicious    boolean,
  block_reason     text,
  user_email       text,
  success          boolean,
  blocked_reason   text,
  CONSTRAINT login_attempts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL,
  token_hash       text        NOT NULL,
  expires_at       timestamptz NOT NULL,
  used_at          timestamptz,
  ip_address       inet,
  created_at       timestamptz DEFAULT now(),
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  event_type       text        NOT NULL,
  user_id          uuid,
  user_email       text,
  ip_address       text,
  user_agent       text,
  metadata         jsonb,
  severity         text,
  created_at       timestamptz DEFAULT now(),
  CONSTRAINT security_audit_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sso_login_attempts (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  email            text,
  provider_id      text,
  event_type       text        NOT NULL,
  success          boolean,
  error_code       text,
  error_message    text,
  context          jsonb,
  created_at       timestamptz DEFAULT now(),
  CONSTRAINT sso_login_attempts_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL,
  role             public.app_role NOT NULL DEFAULT 'viewer',
  assigned_by      uuid,
  assigned_at      timestamptz DEFAULT now(),
  expires_at       timestamptz,
  is_active        boolean     DEFAULT true,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL,
  ip_address       inet,
  user_agent       text,
  revoked          boolean     DEFAULT false,
  last_activity    timestamptz,
  created_at       timestamptz DEFAULT now(),
  last_active      timestamptz,
  device_info      text,
  is_current       boolean     NOT NULL DEFAULT false,
  revoked_at       timestamptz,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.webhook_dlq (
  id               uuid        NOT NULL DEFAULT gen_random_uuid(),
  source           text        NOT NULL,
  event_type       text,
  external_id      text,
  payload          jsonb       NOT NULL DEFAULT '{}',
  headers          jsonb,
  error_message    text,
  attempts         integer     NOT NULL DEFAULT 0,
  first_failed_at  timestamptz NOT NULL DEFAULT now(),
  last_attempt_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at      timestamptz,
  resolved_by      uuid,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_dlq_pkey PRIMARY KEY (id)
);
