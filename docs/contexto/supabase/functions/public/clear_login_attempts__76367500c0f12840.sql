CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  DELETE FROM login_attempts WHERE email = lower(p_email);
END;
$function$
