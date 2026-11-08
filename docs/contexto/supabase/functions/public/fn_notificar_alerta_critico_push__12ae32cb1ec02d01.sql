CREATE OR REPLACE FUNCTION public.fn_notificar_alerta_critico_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  v_segredo text;
BEGIN
  IF NEW.prioridade IS DISTINCT FROM 'critica' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS NULL OR COALESCE(NEW.titulo,'') = '' OR COALESCE(NEW.mensagem,'') = '' THEN
    RAISE WARNING
      'fn_notificar_alerta_critico_push: alerta % sem user_id/titulo/mensagem, push nao enviado', NEW.id;
    RETURN NEW;
  END IF;

  SELECT valor INTO v_segredo
    FROM public.integration_secrets
   WHERE chave = 'send_push_notification'
   LIMIT 1;

  IF v_segredo IS NULL THEN
    RAISE WARNING
      'fn_notificar_alerta_critico_push: segredo send_push_notification ausente, alerta % nao notificado', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_segredo
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'title', NEW.titulo,
      'body', NEW.mensagem,
      'prioridade', NEW.prioridade,
      'data', jsonb_build_object('url', NEW.acao_url)
    ),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING
    'fn_notificar_alerta_critico_push falhou para o alerta %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$
