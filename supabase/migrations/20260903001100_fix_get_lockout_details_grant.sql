-- Migration 20260903001100
-- PROBLEMA: get_lockout_details(_email text) é SECURITY DEFINER mas não tem
-- GRANT EXECUTE para anon nem authenticated. Chamadas do frontend (pré-login)
-- retornam 42501 e o painel de lockout nunca exibe o tempo restante ao usuário.
-- FIX: GRANT EXECUTE para anon e authenticated.
-- Risco de enumeração aceitável: atacante já sabe que está bloqueado ao tentar login.

BEGIN;

GRANT EXECUTE ON FUNCTION public.get_lockout_details(text) TO anon, authenticated;

COMMIT;
