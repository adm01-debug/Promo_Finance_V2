CREATE INDEX IF NOT EXISTS idx_alert_configurations_is_enabled_true
  ON public.alert_configurations (alert_type, channel)
  WHERE is_enabled = true;