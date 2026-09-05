-- Corrige notify_performance_alert_trigger: a versao em producao apontava para
-- o projeto de origem lszcmoymovkpckehlagr (URL + anon key), entao todo alerta
-- critical/warning fazia POST para um projeto morto e o EXCEPTION engolia o erro.
-- URL e apikey trocados para o destino bwwbeyolnnzppeuhgkcd.

CREATE OR REPLACE FUNCTION public.notify_performance_alert_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  v_url text;
  v_anon text;
  v_payload jsonb;
BEGIN
  -- Só notifica critical/warning
  IF NEW.severity NOT IN ('critical','warning') THEN
    RETURN NEW;
  END IF;

  v_url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/notify-performance-alert';
  v_anon := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3d2JleW9sbm56cHBldWhna2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDE3MjYsImV4cCI6MjA5NDYxNzcyNn0.wGN-iP_o9qKWR6dO0croDF7ESjQWCreTW1l4AZsIgIM';

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
$function$;
