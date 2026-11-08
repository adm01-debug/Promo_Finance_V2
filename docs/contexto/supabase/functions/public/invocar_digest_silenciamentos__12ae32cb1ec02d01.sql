CREATE OR REPLACE FUNCTION public.invocar_digest_silenciamentos()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
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
$function$
