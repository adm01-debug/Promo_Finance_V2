CREATE OR REPLACE FUNCTION public.check_login_lockout_v2(p_email text, p_ip_address inet DEFAULT NULL::inet)
 RETURNS TABLE(is_locked boolean, remaining_seconds integer, attempt_count integer, is_ip_blocked boolean, block_reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_record login_attempts%ROWTYPE;
  v_ip_blocked blocked_ips%ROWTYPE;
  v_ip_attempts integer;
BEGIN
  -- Verificar se IP está bloqueado permanentemente ou temporariamente
  IF p_ip_address IS NOT NULL THEN
    SELECT * INTO v_ip_blocked
    FROM blocked_ips
    WHERE ip_address = p_ip_address
      AND (is_permanent = true OR expires_at > now());
    
    IF v_ip_blocked IS NOT NULL THEN
      RETURN QUERY SELECT 
        true,
        CASE WHEN v_ip_blocked.is_permanent THEN 86400 
             ELSE EXTRACT(EPOCH FROM (v_ip_blocked.expires_at - now()))::integer 
        END,
        0,
        true,
        v_ip_blocked.reason;
      RETURN;
    END IF;
    
    -- Verificar rate limit por IP (máximo 20 tentativas em 1 hora)
    SELECT COUNT(*) INTO v_ip_attempts
    FROM login_attempts
    WHERE ip_address = p_ip_address
      AND last_attempt_at > now() - interval '1 hour';
    
    IF v_ip_attempts >= 20 THEN
      -- Bloquear IP temporariamente
      INSERT INTO blocked_ips (ip_address, reason, expires_at)
      VALUES (p_ip_address, 'Excesso de tentativas de login', now() + interval '1 hour')
      ON CONFLICT (ip_address) DO UPDATE SET
        expires_at = now() + interval '1 hour',
        attempts_count = blocked_ips.attempts_count + 1;
      
      RETURN QUERY SELECT true, 3600, v_ip_attempts, true, 'IP bloqueado por excesso de tentativas'::text;
      RETURN;
    END IF;
  END IF;

  -- Verificar lockout por email
  SELECT * INTO v_record
  FROM login_attempts
  WHERE email = lower(p_email)
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, false, NULL::text;
    RETURN;
  END IF;

  -- Reset se primeira tentativa foi há mais de 24 horas
  IF v_record.first_attempt_at < now() - interval '24 hours' THEN
    DELETE FROM login_attempts WHERE email = lower(p_email);
    RETURN QUERY SELECT false, 0, 0, false, NULL::text;
    RETURN;
  END IF;

  -- Verificar se está bloqueado
  IF v_record.locked_until IS NOT NULL AND v_record.locked_until > now() THEN
    RETURN QUERY SELECT 
      true,
      EXTRACT(EPOCH FROM (v_record.locked_until - now()))::integer,
      v_record.attempt_count,
      false,
      v_record.block_reason;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 0, v_record.attempt_count, false, NULL::text;
END;
$function$
