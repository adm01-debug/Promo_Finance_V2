-- Migration 20260904000200
-- PROBLEMA: increment_failed_attempts(_email text) nunca recebeu GRANT EXECUTE para anon.
-- Auth.hooks.ts chama a função pré-login (usuário ainda é anon), o erro é ignorado,
-- account_lockouts nunca é preenchido e is_user_locked() retorna false para sempre.
-- FIX: conceder EXECUTE a anon. A função não retorna dados — apenas incrementa o contador
-- em account_lockouts — sem oracle de existência de e-mail. Risco DoS de lockout artificial
-- é aceito (igual ao design original pré-REVOKE).

BEGIN;

GRANT EXECUTE ON FUNCTION public.increment_failed_attempts(text) TO anon;

COMMIT;
