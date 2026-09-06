-- Migration 20260904000400
-- PROBLEMA: is_user_locked passa _email raw para get_lockout_details.
--   get_lockout_details usa WHERE email = _email (sem lower/btrim).
--   increment_failed_attempts armazena lower(btrim(email)).
--   Resultado: email uppercase → get_lockout_details retorna NULL → lockout ignorado.
-- FIX: recriar is_user_locked normalizando antes de chamar get_lockout_details.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_user_locked(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_email text := lower(btrim(_email));
  v_result RECORD;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_result FROM public.get_lockout_details(v_email);
  RETURN FOUND AND v_result.is_locked;
END;
$function$;

COMMIT;
