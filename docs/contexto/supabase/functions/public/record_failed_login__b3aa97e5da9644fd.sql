CREATE OR REPLACE FUNCTION public.record_failed_login(p_email text, p_ip_address inet DEFAULT NULL::inet)
 RETURNS TABLE(is_now_locked boolean, lockout_seconds integer, total_attempts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_record login_attempts%ROWTYPE;
  v_new_count integer;
  v_lockout_duration interval;
BEGIN
  SELECT * INTO v_record
  FROM login_attempts
  WHERE email = lower(p_email)
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  -- Reset if first attempt was more than 24 hours ago
  IF v_record IS NOT NULL AND v_record.first_attempt_at < now() - interval '24 hours' THEN
    DELETE FROM login_attempts WHERE email = lower(p_email);
    v_record := NULL;
  END IF;

  IF v_record IS NULL THEN
    -- First failed attempt
    INSERT INTO login_attempts (email, ip_address, attempt_count)
    VALUES (lower(p_email), p_ip_address, 1);
    
    RETURN QUERY SELECT false, 0, 1;
    RETURN;
  END IF;

  v_new_count := v_record.attempt_count + 1;

  -- Calculate exponential lockout after 5 attempts
  -- 5 attempts: 30 seconds
  -- 6 attempts: 1 minute
  -- 7 attempts: 2 minutes
  -- 8 attempts: 4 minutes
  -- 9 attempts: 8 minutes
  -- 10+ attempts: 15 minutes max
  IF v_new_count >= 5 THEN
    v_lockout_duration := (30 * power(2, LEAST(v_new_count - 5, 5)))::integer * interval '1 second';
    IF v_lockout_duration > interval '15 minutes' THEN
      v_lockout_duration := interval '15 minutes';
    END IF;
    
    UPDATE login_attempts
    SET 
      attempt_count = v_new_count,
      last_attempt_at = now(),
      locked_until = now() + v_lockout_duration,
      ip_address = COALESCE(p_ip_address, login_attempts.ip_address)
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT 
      true, 
      EXTRACT(EPOCH FROM v_lockout_duration)::integer,
      v_new_count;
    RETURN;
  END IF;

  -- Not yet at lockout threshold
  UPDATE login_attempts
  SET 
    attempt_count = v_new_count,
    last_attempt_at = now(),
    ip_address = COALESCE(p_ip_address, login_attempts.ip_address)
  WHERE id = v_record.id;

  RETURN QUERY SELECT false, 0, v_new_count;
END;
$function$
