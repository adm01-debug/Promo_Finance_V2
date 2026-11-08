CREATE OR REPLACE FUNCTION public.record_failed_login_v2(p_email text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
 RETURNS TABLE(is_locked boolean, lockout_seconds integer, attempt_count integer, is_suspicious boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_record login_attempts%ROWTYPE;
  v_new_count integer;
  v_lockout_duration interval;
  v_is_suspicious boolean := false;
  v_block_reason text;
BEGIN
  -- Verificar padrões suspeitos: mesmo IP tentando múltiplos emails
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(DISTINCT email) > 5 INTO v_is_suspicious
    FROM login_attempts
    WHERE ip_address = p_ip_address
      AND last_attempt_at > now() - interval '10 minutes';
  END IF;

  SELECT * INTO v_record
  FROM login_attempts
  WHERE email = lower(p_email)
  ORDER BY last_attempt_at DESC
  LIMIT 1;

  -- Reset se primeira tentativa foi há mais de 24 horas
  IF v_record IS NOT NULL AND v_record.first_attempt_at < now() - interval '24 hours' THEN
    DELETE FROM login_attempts WHERE email = lower(p_email);
    v_record := NULL;
  END IF;

  IF v_record IS NULL THEN
    INSERT INTO login_attempts (email, ip_address, attempt_count, user_agent, is_suspicious)
    VALUES (lower(p_email), p_ip_address, 1, p_user_agent, v_is_suspicious);
    
    RETURN QUERY SELECT false, 0, 1, v_is_suspicious;
    RETURN;
  END IF;

  v_new_count := v_record.attempt_count + 1;

  -- Rate limiting RIGOROSO:
  -- 3 tentativas: 1 minuto
  -- 4 tentativas: 5 minutos
  -- 5 tentativas: 15 minutos
  -- 6 tentativas: 30 minutos
  -- 7 tentativas: 1 hora
  -- 8+ tentativas: 2 horas
  IF v_new_count >= 3 THEN
    CASE 
      WHEN v_new_count = 3 THEN 
        v_lockout_duration := interval '1 minute';
        v_block_reason := 'Múltiplas tentativas incorretas';
      WHEN v_new_count = 4 THEN 
        v_lockout_duration := interval '5 minutes';
        v_block_reason := 'Tentativas persistentes';
      WHEN v_new_count = 5 THEN 
        v_lockout_duration := interval '15 minutes';
        v_block_reason := 'Possível ataque de força bruta';
      WHEN v_new_count = 6 THEN 
        v_lockout_duration := interval '30 minutes';
        v_block_reason := 'Ataque de força bruta detectado';
      WHEN v_new_count = 7 THEN 
        v_lockout_duration := interval '1 hour';
        v_block_reason := 'Ataque persistente';
      ELSE 
        v_lockout_duration := interval '2 hours';
        v_block_reason := 'Conta sob ataque - bloqueio estendido';
    END CASE;
    
    -- Se suspeito, dobrar tempo de lockout
    IF v_is_suspicious OR v_record.is_suspicious THEN
      v_lockout_duration := v_lockout_duration * 2;
      v_block_reason := v_block_reason || ' (atividade suspeita)';
    END IF;
    
    UPDATE login_attempts
    SET 
      attempt_count = v_new_count,
      last_attempt_at = now(),
      locked_until = now() + v_lockout_duration,
      ip_address = COALESCE(p_ip_address, login_attempts.ip_address),
      user_agent = COALESCE(p_user_agent, login_attempts.user_agent),
      is_suspicious = v_is_suspicious OR login_attempts.is_suspicious,
      block_reason = v_block_reason
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT 
      true, 
      EXTRACT(EPOCH FROM v_lockout_duration)::integer,
      v_new_count,
      v_is_suspicious OR v_record.is_suspicious;
    RETURN;
  END IF;

  UPDATE login_attempts
  SET 
    attempt_count = v_new_count,
    last_attempt_at = now(),
    ip_address = COALESCE(p_ip_address, login_attempts.ip_address),
    user_agent = COALESCE(p_user_agent, login_attempts.user_agent),
    is_suspicious = v_is_suspicious OR login_attempts.is_suspicious
  WHERE id = v_record.id;

  RETURN QUERY SELECT false, 0, v_new_count, v_is_suspicious;
END;
$function$
