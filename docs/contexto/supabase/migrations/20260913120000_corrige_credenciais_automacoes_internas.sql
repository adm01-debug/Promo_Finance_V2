-- Step 07+11: Corrige credenciais de automacoes internas
-- INSERT condicional (coluna nome NOT NULL sem DEFAULT)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.integration_secrets WHERE chave = 'internal_jobs') THEN
    INSERT INTO public.integration_secrets (chave, nome, valor, descricao)
    VALUES ('internal_jobs', 'internal_jobs', encode(gen_random_bytes(32), 'hex'),
            'Segredo x-cron-secret das automacoes internas (exigirChamadaInterna, chave padrao)');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.integration_secrets WHERE chave = 'send_push_notification') THEN
    INSERT INTO public.integration_secrets (chave, nome, valor, descricao)
    VALUES ('send_push_notification', 'send_push_notification', encode(gen_random_bytes(32), 'hex'),
            'Segredo x-cron-secret do trigger de push para alertas criticos (exigirInternaOuUsuario)');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.segredo_cron(p_chave text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_valor text;
BEGIN
  SELECT valor INTO v_valor
    FROM public.integration_secrets
   WHERE chave = p_chave
   LIMIT 1;

  IF v_valor IS NULL OR length(v_valor) < 16 THEN
    RAISE EXCEPTION 'Segredo interno "%" ausente ou fraco em integration_secrets', p_chave;
  END IF;

  RETURN v_valor;
END;
$$;

COMMENT ON FUNCTION public.segredo_cron(text) IS
  'Le o x-cron-secret de integration_secrets. Falha fechada: segredo ausente nunca vira chamada sem credencial.';

REVOKE ALL ON FUNCTION public.segredo_cron(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.segredo_cron(text) TO service_role;

CREATE OR REPLACE FUNCTION public.chave_anon_vault()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_catalog
AS $$
DECLARE
  v_chave text;
BEGIN
  SELECT decrypted_secret INTO v_chave
    FROM vault.decrypted_secrets
   WHERE name = 'anon_key'
   LIMIT 1;

  IF v_chave IS NULL OR v_chave = '' THEN
    RAISE EXCEPTION
      'Secret "anon_key" ausente no Vault. Crie-o em Project Settings > Vault com a anon key de bwwbeyolnnzppeuhgkcd.';
  END IF;

  RETURN v_chave;
END;
$$;

COMMENT ON FUNCTION public.chave_anon_vault() IS
  'Anon key publica lida do Vault em tempo de chamada, para funcoes com verify_jwt=true. Rotacionavel sem migration.';

REVOKE ALL ON FUNCTION public.chave_anon_vault() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chave_anon_vault() TO service_role;

CREATE OR REPLACE FUNCTION public.notify_performance_alert_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
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
$$;

COMMENT ON FUNCTION public.notify_performance_alert_trigger() IS
  'Notifica alertas critical/warning via notify-performance-alert usando x-cron-secret. Nunca bloqueia o INSERT; falhas viram WARNING no log em vez de silencio.';

DROP TRIGGER IF EXISTS performance_alerts_notify_trigger ON public.performance_alerts;
CREATE TRIGGER performance_alerts_notify_trigger
AFTER INSERT ON public.performance_alerts
FOR EACH ROW
EXECUTE FUNCTION public.notify_performance_alert_trigger();

CREATE OR REPLACE FUNCTION public.invocar_digest_silenciamentos()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/digest-silenciamentos-erro',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', public.segredo_cron('internal_jobs')
    ),
    body := jsonb_build_object('janelaHoras', 168, 'minIntervaloHoras', 144),
    timeout_milliseconds := 30000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invocar_digest_silenciamentos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invocar_digest_silenciamentos() TO service_role;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'digest-silenciamentos-erro') THEN
    PERFORM cron.unschedule('digest-silenciamentos-erro');
  END IF;
  PERFORM cron.schedule(
    'digest-silenciamentos-erro',
    '0 11 * * 1',
    'SELECT public.invocar_digest_silenciamentos();'
  );
END
$do$;

CREATE OR REPLACE FUNCTION public.invocar_digest_conformidade()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/enviar-digest-conformidade',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', public.chave_anon_vault(),
      'x-cron-secret', public.segredo_cron('conformidade_cron')
    ),
    body := jsonb_build_object('severidadeMinima', 'baixa', 'limite', 300),
    timeout_milliseconds := 30000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invocar_digest_conformidade() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invocar_digest_conformidade() TO service_role;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'enviar-digest-conformidade-horario') THEN
    PERFORM cron.unschedule('enviar-digest-conformidade-horario');
  END IF;
  PERFORM cron.schedule(
    'enviar-digest-conformidade-horario',
    '30 * * * *',
    'SELECT public.invocar_digest_conformidade();'
  );
END
$do$;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'anon_key') THEN
    RAISE WARNING 'Secret "anon_key" ausente no Vault: o cron enviar-digest-conformidade-horario falhara ate ele ser criado.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Nao foi possivel inspecionar o Vault (%): confira o secret "anon_key" manualmente.', SQLERRM;
END
$do$;

CREATE OR REPLACE FUNCTION public.fn_notificar_alerta_critico_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
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
$$;

COMMENT ON FUNCTION public.fn_notificar_alerta_critico_push() IS
  'Envia push para alertas de prioridade critica via send-push-notification usando x-cron-secret. Nunca bloqueia o INSERT; falhas viram WARNING em vez de NULL silencioso.';

DROP TRIGGER IF EXISTS trg_notificar_alerta_critico_push ON public.alertas;
CREATE TRIGGER trg_notificar_alerta_critico_push
AFTER INSERT ON public.alertas
FOR EACH ROW
EXECUTE FUNCTION public.fn_notificar_alerta_critico_push();

CREATE OR REPLACE FUNCTION public.trigger_whatsapp_ai_analysis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_catalog, extensions
AS $$
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
$$;

COMMENT ON FUNCTION public.trigger_whatsapp_ai_analysis() IS
  'Dispara whatsapp-ai-analyzer com a service_role key do Vault (coluna decrypted_secret). search_path fixo e falha nao bloqueante.';

DROP TRIGGER IF EXISTS on_whatsapp_message_inserted ON public.historico_cobranca_whatsapp;
CREATE TRIGGER on_whatsapp_message_inserted
AFTER INSERT ON public.historico_cobranca_whatsapp
FOR EACH ROW
EXECUTE FUNCTION public.trigger_whatsapp_ai_analysis();
