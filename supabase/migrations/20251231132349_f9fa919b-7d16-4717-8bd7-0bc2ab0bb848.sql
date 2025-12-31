-- Add lockout_count column to track number of lockouts for exponential backoff
ALTER TABLE public.account_lockouts 
ADD COLUMN IF NOT EXISTS lockout_count integer DEFAULT 0;

-- Update the increment_failed_attempts function with exponential backoff
CREATE OR REPLACE FUNCTION public.increment_failed_attempts(_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_attempts INTEGER;
  current_lockout_count INTEGER;
  max_attempts INTEGER := 5;
  base_lockout_minutes INTEGER := 1;
  calculated_lockout_minutes INTEGER;
BEGIN
  -- Get current lockout count for exponential calculation
  SELECT COALESCE(lockout_count, 0) INTO current_lockout_count 
  FROM public.account_lockouts WHERE user_email = _email;
  
  IF current_lockout_count IS NULL THEN
    current_lockout_count := 0;
  END IF;

  INSERT INTO public.account_lockouts (user_email, failed_attempts, last_failed_attempt, updated_at, lockout_count)
  VALUES (_email, 1, now(), now(), 0)
  ON CONFLICT (user_email) DO UPDATE
  SET failed_attempts = account_lockouts.failed_attempts + 1,
      last_failed_attempt = now(),
      updated_at = now();

  -- Check if we hit max attempts and need to apply lockout
  SELECT failed_attempts INTO current_attempts 
  FROM public.account_lockouts WHERE user_email = _email;
  
  IF current_attempts >= max_attempts THEN
    -- Calculate exponential lockout: base * 2^lockout_count
    -- 1st lockout: 1 min, 2nd: 2 min, 3rd: 4 min, 4th: 8 min, 5th: 16 min, etc.
    -- Cap at 24 hours (1440 minutes)
    calculated_lockout_minutes := LEAST(base_lockout_minutes * POWER(2, current_lockout_count)::INTEGER, 1440);
    
    UPDATE public.account_lockouts
    SET locked_until = now() + (calculated_lockout_minutes || ' minutes')::interval,
        lockout_count = lockout_count + 1,
        failed_attempts = 0  -- Reset attempts after lockout is applied
    WHERE user_email = _email;
    
    -- Create security alert with lockout duration info
    INSERT INTO public.security_alerts (type, severity, title, description, user_email)
    VALUES ('account_locked', 'high', 
            'Conta bloqueada por tentativas excessivas', 
            format('A conta %s foi bloqueada por %s minutos após %s tentativas falhas de login (bloqueio #%s)',
                   _email, calculated_lockout_minutes, max_attempts, current_lockout_count + 1),
            _email);
  END IF;
END;
$function$;

-- Update reset_failed_attempts to optionally reset lockout_count after successful login
CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Reset failed attempts but keep lockout_count for progressive lockouts
  -- lockout_count will naturally decay over time or can be manually reset by admin
  UPDATE public.account_lockouts 
  SET failed_attempts = 0,
      locked_until = NULL
  WHERE user_email = _email;
  
  -- If no record exists, nothing to reset
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Reset lockout_count if last lockout was more than 24 hours ago
  UPDATE public.account_lockouts
  SET lockout_count = 0
  WHERE user_email = _email
    AND (locked_until IS NULL OR locked_until < now() - INTERVAL '24 hours');
END;
$function$;