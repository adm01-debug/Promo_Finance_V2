CREATE OR REPLACE FUNCTION public.notify_performance_alert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','pg_catalog','extensions'
AS $$
DECLARE
  v_url text;
  v_anon text;
  v_payload jsonb;
BEGIN
  -- Só notifica critical/warning
  IF NEW.severity NOT IN ('critical','warning') THEN
    RETURN NEW;
  END IF;

  v_url := 'https://lszcmoymovkpckehlagr.supabase.co/functions/v1/notify-performance-alert';
  v_anon := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzemNtb3ltb3ZrcGNrZWhsYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE2MTAsImV4cCI6MjA5NDI1NzYxMH0.ksTr8881Ic6U5doXsrEETVL9fGsaddNPf-m1lAt1pw0';

  v_payload := jsonb_build_object(
    'alert', jsonb_build_object(
      'id', NEW.id,
      'source', NEW.source,
      'alert_key', NEW.alert_key,
      'severity', NEW.severity,
      'reason', NEW.reason,
      'current_value', NEW.current_value,
      'baseline_value', NEW.baseline_value,
      'ratio', NEW.ratio,
      'sample_count', NEW.sample_count,
      'query_snippet', NEW.query_snippet,
      'created_at', NEW.created_at
    )
  );

  -- Async HTTP call — não bloqueia o INSERT
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon
    ),
    body := v_payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca falha o INSERT do alerta por erro de notificação
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS performance_alerts_notify_trigger ON public.performance_alerts;
CREATE TRIGGER performance_alerts_notify_trigger
AFTER INSERT ON public.performance_alerts
FOR EACH ROW
EXECUTE FUNCTION public.notify_performance_alert_trigger();

COMMENT ON FUNCTION public.notify_performance_alert_trigger() IS
  'Dispara notificação assíncrona via edge function notify-performance-alert para alertas critical/warning. Nunca bloqueia o INSERT.';