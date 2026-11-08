CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM login_attempts
  WHERE last_attempt_at < now() - interval '7 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  DELETE FROM blocked_ips
  WHERE is_permanent = false AND expires_at < now() - interval '1 day';
  
  RETURN v_deleted;
END;
$function$
