CREATE OR REPLACE FUNCTION public.get_lockout_details(_email text)
 RETURNS TABLE(is_locked boolean, remaining_minutes integer, lockout_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_attempts INTEGER;
  v_last_attempt TIMESTAMP WITH TIME ZONE;
  v_lockout_duration_minutes INTEGER := 15; -- Configuração padrão
BEGIN
  SELECT attempt_count, last_attempt_at 
  INTO v_attempts, v_last_attempt
  FROM public.login_attempts
  WHERE email = _email;

  IF v_attempts >= 5 AND v_last_attempt > now() - (v_lockout_duration_minutes || ' minutes')::interval THEN
    is_locked := TRUE;
    remaining_minutes := EXTRACT(MINUTE FROM (v_last_attempt + (v_lockout_duration_minutes || ' minutes')::interval) - now())::INTEGER;
    lockout_count := (v_attempts / 5)::INTEGER;
  ELSE
    is_locked := FALSE;
    remaining_minutes := 0;
    lockout_count := 0;
  END IF;

  RETURN NEXT;
END;
$function$
