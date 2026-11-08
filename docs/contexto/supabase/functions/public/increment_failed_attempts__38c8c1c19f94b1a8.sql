CREATE OR REPLACE FUNCTION public.increment_failed_attempts(_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_email text := lower(btrim(_email));
  v_proxima_tentativa integer;
  v_atualizadas integer;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email obrigatório' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('increment_failed_attempts:' || v_email, 0)
  );

  SELECT coalesce(max(attempt_count), 0) + 1
    INTO v_proxima_tentativa
  FROM public.login_attempts
  WHERE lower(btrim(email)) = v_email;

  UPDATE public.login_attempts
     SET attempt_count = v_proxima_tentativa,
         last_attempt_at = now(),
         success = false
   WHERE lower(btrim(email)) = v_email;

  GET DIAGNOSTICS v_atualizadas = ROW_COUNT;

  IF v_atualizadas = 0 THEN
    INSERT INTO public.login_attempts (
      email, attempt_count, last_attempt_at, success
    )
    VALUES (v_email, 1, now(), false);
  END IF;
END
$function$
