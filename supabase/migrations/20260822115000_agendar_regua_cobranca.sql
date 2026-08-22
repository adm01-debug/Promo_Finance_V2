-- Agenda a régua às 09:00 de São Paulo (pg_cron opera em GMT/UTC).
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.invocar_regua_cobranca(p_dry_run boolean DEFAULT false)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net, extensions
AS $$
DECLARE
  v_cron_secret text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret
    INTO v_cron_secret
    FROM vault.decrypted_secrets
   WHERE name = 'regua_cron_secret'
   LIMIT 1;

  IF v_cron_secret IS NULL OR length(v_cron_secret) < 32 THEN
    RAISE EXCEPTION 'Secret regua_cron_secret ausente ou inválido no Vault';
  END IF;

  SELECT net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/executar-regua-cobranca',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_cron_secret
    ),
    body := jsonb_build_object('dry_run', p_dry_run),
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invocar_regua_cobranca(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invocar_regua_cobranca(boolean) TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('executar-regua-cobranca-diaria')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'executar-regua-cobranca-diaria');

  PERFORM cron.schedule(
    'executar-regua-cobranca-diaria',
    '0 12 * * *',
    'SELECT public.invocar_regua_cobranca(false);'
  );
END;
$$;
