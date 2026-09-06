-- Migration 20260904000300
-- PROBLEMA 1: reset_failed_attempts usa WHERE email = _email (sem normalização)
--   enquanto increment_failed_attempts usa lower(btrim()). Email em uppercase
--   incrementa counter mas never reseta → lockout artificial cumulativo.
-- PROBLEMA 2: reset_failed_attempts não tem GRANT EXECUTE para authenticated.
--   Auth.hooks.ts:235 chama post-login (usuário já autenticado); a chamada
--   retornava permission denied silencioso, counter nunca zerava.
-- FIX: recriar função com normalização consistente + GRANT para authenticated.

BEGIN;

CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_email text := lower(btrim(_email));
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN;
  END IF;

  UPDATE public.login_attempts
     SET attempt_count = 0,
         success = true,
         last_attempt_at = now()
   WHERE lower(btrim(email)) = v_email;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.reset_failed_attempts(text) TO authenticated;

COMMIT;

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260904000300',
  'fix_reset_failed_attempts',
  ARRAY[
    'CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text) — normaliza com lower(btrim) para consistência com increment_failed_attempts',
    'GRANT EXECUTE ON FUNCTION public.reset_failed_attempts(text) TO authenticated'
  ]
)
ON CONFLICT (version) DO NOTHING;
