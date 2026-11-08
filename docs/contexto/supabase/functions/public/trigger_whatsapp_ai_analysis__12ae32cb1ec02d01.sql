CREATE OR REPLACE FUNCTION public.trigger_whatsapp_ai_analysis()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  v_chave text;
BEGIN
  SELECT decrypted_secret INTO v_chave
    FROM vault.decrypted_secrets
   WHERE name = 'service_role_key'
   LIMIT 1;

  IF v_chave IS NULL OR v_chave = '' THEN
    RAISE WARNING
      'trigger_whatsapp_ai_analysis: secret service_role_key ausente no Vault, mensagem % nao analisada', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/whatsapp-ai-analyzer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_chave
    ),
    body := jsonb_build_object('record', row_to_json(NEW)),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING
    'trigger_whatsapp_ai_analysis falhou para a mensagem %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$
