CREATE OR REPLACE FUNCTION public.cleanup_old_cron_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.cron_job_logs
  WHERE created_at < now() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$
