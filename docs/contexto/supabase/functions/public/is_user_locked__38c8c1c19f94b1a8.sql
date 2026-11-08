CREATE OR REPLACE FUNCTION public.is_user_locked(_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_locked boolean := false;
BEGIN
  SELECT COALESCE(is_locked, false) INTO v_locked
  FROM public.get_lockout_details(_email)
  LIMIT 1;
  RETURN COALESCE(v_locked, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$
