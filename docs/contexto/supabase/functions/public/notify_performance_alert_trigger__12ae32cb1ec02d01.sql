CREATE OR REPLACE FUNCTION public.notify_performance_alert_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  v_segredo text;
  v_payload jsonb;
BEGIN
  IF NEW.severity NOT IN ('critical','warning') THEN
    RETURN NEW;
  END IF;

  SELECT valor INTO v_segredo
    FROM public.integration_secrets
   WHERE chave = 'internal_jobs'
   LIMIT 1;

  IF v_segredo IS NULL THEN
    RAISE WARNING
      'notify_performance_alert_trigger: segredo internal_jobs ausente, alerta % nao notificado', NEW.id;
    RETURN NEW;
  END IF;

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

  PERFORM net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/notify-performance-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_segredo
    ),
    body := v_payload,
    timeout_milliseconds := 15000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING
    'notify_performance_alert_trigger falhou para o alerta %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$
