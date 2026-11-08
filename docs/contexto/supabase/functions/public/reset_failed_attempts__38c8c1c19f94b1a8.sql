CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  UPDATE public.login_attempts
  SET attempt_count = 0,
      success = true,
      last_attempt_at = now()
  WHERE email = _email;
END;
$function$
