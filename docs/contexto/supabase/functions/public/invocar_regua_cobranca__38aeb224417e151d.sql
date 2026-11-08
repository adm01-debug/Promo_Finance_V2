CREATE OR REPLACE FUNCTION public.invocar_regua_cobranca(p_dry_run boolean DEFAULT false)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'net', 'extensions'
AS $function$ DECLARE v_cron_secret text; v_request_id bigint; BEGIN SELECT decrypted_secret INTO v_cron_secret FROM vault.decrypted_secrets WHERE name = 'regua_cron_secret' LIMIT 1; IF v_cron_secret IS NULL OR length(v_cron_secret) < 32 THEN RAISE EXCEPTION 'Secret regua_cron_secret ausente ou invalido no Vault'; END IF; SELECT net.http_post(url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/executar-regua-cobranca', headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_cron_secret), body := jsonb_build_object('dry_run', p_dry_run), timeout_milliseconds := 30000) INTO v_request_id; RETURN v_request_id; END; $function$
