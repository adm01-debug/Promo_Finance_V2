CREATE INDEX IF NOT EXISTS idx_alert_configurations_enabled
  ON public.alert_configurations (alert_type, channel)
  WHERE is_enabled = true;