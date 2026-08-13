-- ============================================================================
-- Gap #35 — automações internas deixam de se autenticar com a chave pública
-- ----------------------------------------------------------------------------
-- Problema: pg_cron e triggers chamavam Edge Functions privilegiadas enviando
-- apenas o anon key. O anon key é público (vai no bundle do frontend), então na
-- prática esses endpoints eram anônimos: qualquer um podia disparar envio de
-- e-mails, mensagens de WhatsApp, régua de cobrança e gasto de IA.
-- Solução: header `x-cron-secret` com segredo rotacionável em integration_secrets.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.internal_job_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
  SELECT valor FROM public.integration_secrets WHERE chave = 'internal_jobs' LIMIT 1;
$$;

COMMENT ON FUNCTION public.internal_job_secret() IS
  'Segredo compartilhado das automacoes internas. Uso exclusivo de pg_cron/triggers; nunca exposto a roles de API.';

-- Fecha a superfície: nenhuma role de API pode ler o segredo através da função.
REVOKE ALL ON FUNCTION public.internal_job_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.internal_job_secret() TO postgres, service_role;

-- ---------------------------------------------------------------------------
-- Trigger de alertas de performance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_performance_alert_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
DECLARE
  v_url text;
  v_secret text;
  v_payload jsonb;
BEGIN
  IF NEW.severity NOT IN ('critical','warning') THEN
    RETURN NEW;
  END IF;

  v_url := 'https://lszcmoymovkpckehlagr.supabase.co/functions/v1/notify-performance-alert';
  v_secret := public.internal_job_secret();

  -- Falha fechada: sem segredo configurado não disparamos a chamada. Preferimos
  -- perder uma notificação a manter um endpoint privilegiado aberto.
  IF v_secret IS NULL THEN
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
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := v_payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- Reescrita dos jobs pg_cron que ainda usavam apenas o anon key
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_base text := 'https://lszcmoymovkpckehlagr.supabase.co/functions/v1/';
BEGIN
  IF to_regnamespace('cron') IS NULL THEN
    RAISE NOTICE 'pg_cron ausente; nada a reescrever';
    RETURN;
  END IF;

  PERFORM cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'digest-silenciamentos-erro'),
    command := format($cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', public.internal_job_secret()),
        body := jsonb_build_object('janelaHoras', 168, 'minIntervaloHoras', 144)
      ) AS request_id;
    $cmd$, v_base || 'digest-silenciamentos-erro')
  ) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'digest-silenciamentos-erro');

  PERFORM cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'evaluate-delivery-alerts-every-min'),
    command := format($cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', public.internal_job_secret()),
        body := jsonb_build_object('trigger','cron','ts', now())
      ) AS request_id;
    $cmd$, v_base || 'evaluate-delivery-alerts')
  ) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'evaluate-delivery-alerts-every-min');

  PERFORM cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'monitorar-erros-frontend'),
    command := format($cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', public.internal_job_secret()),
        body := jsonb_build_object('windowMinutes', 15, 'threshold', 10, 'cooldownMinutes', 60)
      ) AS request_id;
    $cmd$, v_base || 'monitorar-erros-frontend')
  ) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monitorar-erros-frontend');

  PERFORM cron.alter_job(
    (SELECT jobid FROM cron.job WHERE jobname = 'webhook-retry-worker-1min'),
    command := format($cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', public.internal_job_secret()),
        body := jsonb_build_object('trigger','cron','limit',50)
      ) AS request_id;
    $cmd$, v_base || 'webhook-retry-worker')
  ) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'webhook-retry-worker-1min');
END;
$$;

-- ---------------------------------------------------------------------------
-- Gate: nenhum job agendado pode voltar a se autenticar só com o anon key.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_bad text;
BEGIN
  IF to_regnamespace('cron') IS NULL THEN RETURN; END IF;

  SELECT string_agg(jobname, ', ')
    INTO v_bad
  FROM cron.job
  WHERE command ILIKE '%functions/v1/%'
    AND command NOT ILIKE '%x-cron-secret%';

  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'Gate #23: jobs chamando Edge Functions sem x-cron-secret: %', v_bad;
  END IF;
END;
$$;