CREATE OR REPLACE FUNCTION public.reset_failed_attempts(_email text) — normaliza com lower(btrim) para consistência com increment_failed_attempts

GRANT EXECUTE ON FUNCTION public.reset_failed_attempts(text) TO authenticated
