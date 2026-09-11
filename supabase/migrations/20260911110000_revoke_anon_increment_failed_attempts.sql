-- O contador pré-login era invocável por anon, permitindo a terceiros elevar
-- artificialmente tentativas de qualquer e-mail. O cliente não o chama mais;
-- a proteção de brute force fica a cargo do Auth/WAF, onde a origem da falha é
-- verificável. Esta migration é idempotente e não altera dados históricos.

DO $$
BEGIN
  IF to_regprocedure('public.increment_failed_attempts(text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.increment_failed_attempts(text) FROM anon;
  END IF;
END;
$$;
