-- Guard: 42P01 — auth_logs may not exist yet on preview branch
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auth_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_created
      ON public.auth_logs (ip_address, created_at DESC)
      WHERE ip_address IS NOT NULL;
  END IF;
END $$;
