CREATE OR REPLACE FUNCTION public.check_login_lockout(p_email text)
 RETURNS TABLE(is_locked boolean, remaining_seconds integer, attempt_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_record login_attempts%ROWTYPE;
BEGIN
  SELECT * INTO v_record
  FROM login_attempts
  WHERE email = lower(p_email)
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  -- Reset if first attempt was more than 24 hours ago
  IF v_record.first_attempt_at < now() - interval '24 hours' THEN
    DELETE FROM login_attempts WHERE email = lower(p_email);
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  -- Check if currently locked
  IF v_record.locked_until IS NOT NULL AND v_record.locked_until > now() THEN
    RETURN QUERY SELECT 
      true,
      EXTRACT(EPOCH FROM (v_record.locked_until - now()))::integer,
      v_record.attempt_count;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 0, v_record.attempt_count;
END;
$function$
