CREATE OR REPLACE FUNCTION public.watch_cron_failures()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_falhas integer;
BEGIN
  SELECT count(*)
    INTO v_falhas
  FROM public.cron_job_logs
  WHERE success IS FALSE
    AND created_at > now() - interval '24 hours';

  RETURN jsonb_build_object(
    'failures_24h', v_falhas,
    'checked_at', now()
  );
END
$function$
