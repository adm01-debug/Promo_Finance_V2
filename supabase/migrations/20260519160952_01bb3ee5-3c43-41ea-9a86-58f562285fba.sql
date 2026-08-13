-- Função para incrementar tentativas falhas
CREATE OR REPLACE FUNCTION public.increment_failed_attempts(_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.login_attempts (email, attempt_count, last_attempt_at, success)
  VALUES (_email, 1, now(), false)
  ON CONFLICT (email) DO UPDATE
  SET attempt_count = login_attempts.attempt_count + 1,
      last_attempt_at = now(),
      success = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para resetar tentativas falhas
CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.login_attempts
  SET attempt_count = 0,
      success = true,
      last_attempt_at = now()
  WHERE email = _email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter detalhes de bloqueio (alias para get_lockout_details solicitado pelo frontend)
CREATE OR REPLACE FUNCTION public.get_lockout_details(_email TEXT)
RETURNS TABLE (
  is_locked BOOLEAN,
  remaining_minutes INTEGER,
  lockout_count INTEGER
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
