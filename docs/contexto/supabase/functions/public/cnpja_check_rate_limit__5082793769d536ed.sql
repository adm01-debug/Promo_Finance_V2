CREATE OR REPLACE FUNCTION public.cnpja_check_rate_limit(_user_id uuid, _max integer DEFAULT 10, _window_minutes integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_window TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window := date_trunc('minute', now()) - (EXTRACT(MINUTE FROM now())::INTEGER % _window_minutes) * INTERVAL '1 minute';

  INSERT INTO public.cnpja_rate_limit (user_id, window_start, request_count)
  VALUES (_user_id, v_window, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET request_count = cnpja_rate_limit.request_count + 1
  RETURNING request_count INTO v_count;

  -- Limpa janelas antigas (best-effort)
  DELETE FROM public.cnpja_rate_limit
  WHERE window_start < now() - INTERVAL '1 day';

  RETURN v_count <= _max;
END;
$function$
