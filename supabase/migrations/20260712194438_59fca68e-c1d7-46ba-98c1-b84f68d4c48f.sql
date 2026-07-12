REVOKE ALL ON FUNCTION public.notify_performance_alert_trigger() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_performance_alert_trigger() TO postgres, service_role;