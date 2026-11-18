CREATE OR REPLACE FUNCTION public.rate_limit_check(_endpoint text, _ip inet, _limit integer, _window_seconds integer DEFAULT 60, _user_agent text DEFAULT NULL::text)
 RETURNS TABLE(permitido boolean, contagem integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_since timestamptz;
  v_agora timestamptz := now();
  v_total integer;
  v_permitido boolean;
BEGIN
  IF _endpoint IS NULL OR _ip IS NULL OR _limit IS NULL THEN
    RAISE EXCEPTION 'rate_limit_check: _endpoint, _ip e _limit sao obrigatorios';
  END IF;

  v_since := v_agora - make_interval(secs => GREATEST(COALESCE(_window_seconds, 60), 1));

  PERFORM pg_advisory_xact_lock(hashtextextended(_endpoint || '|' || host(_ip), 0));

  SELECT count(*) INTO v_total
  FROM public.rate_limit_logs
  WHERE endpoint = _endpoint
    AND ip_address = _ip
    AND created_at >= v_since;

  v_total := v_total + 1;
  v_permitido := v_total <= _limit;

  INSERT INTO public.rate_limit_logs
    (endpoint, ip_address, user_agent, blocked, request_count, window_start, window_end)
  VALUES
    (_endpoint, _ip, _user_agent, NOT v_permitido, 1, v_since, v_agora);

  RETURN QUERY SELECT v_permitido, v_total;
END;
$function$
