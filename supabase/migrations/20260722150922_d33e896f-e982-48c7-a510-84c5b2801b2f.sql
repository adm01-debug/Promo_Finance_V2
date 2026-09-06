DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='alert_configurations') THEN
    CREATE INDEX IF NOT EXISTS idx_alert_configurations_is_enabled_true
      ON public.alert_configurations (alert_type, channel)
      WHERE is_enabled = true;
  END IF;
END $$;
