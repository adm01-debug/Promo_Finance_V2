ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS device_info text,
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE public.blocked_ips
  ADD COLUMN IF NOT EXISTS blocked_until timestamptz,
  ADD COLUMN IF NOT EXISTS permanent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unblocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS unblocked_by uuid;

DO $$ BEGIN
  UPDATE public.blocked_ips SET permanent = is_permanent WHERE permanent IS DISTINCT FROM is_permanent;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  UPDATE public.blocked_ips SET blocked_until = expires_at WHERE blocked_until IS NULL AND expires_at IS NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
