CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_created
  ON public.auth_logs (ip_address, created_at DESC)
  WHERE ip_address IS NOT NULL;