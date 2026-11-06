ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS device_info text,
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE public.blocked_ips
  ADD COLUMN IF NOT EXISTS blocked_until timestamptz,
  ADD COLUMN IF NOT EXISTS permanent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unblocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS unblocked_by uuid;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blocked_ips' AND column_name = 'is_permanent'
  ) THEN
    UPDATE public.blocked_ips SET permanent = is_permanent WHERE permanent IS DISTINCT FROM is_permanent;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blocked_ips' AND column_name = 'expires_at'
  ) THEN
    UPDATE public.blocked_ips SET blocked_until = expires_at WHERE blocked_until IS NULL AND expires_at IS NOT NULL;
  END IF;
END $$;
