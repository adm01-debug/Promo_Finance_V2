-- Migration 20260904000700
-- PROBLEMA: get_lockout_details esta acessivel para PUBLIC e anon.
--   Qualquer cliente (mesmo nao autenticado) pode chamar RPC get_lockout_details('email')
--   e descobrir: se uma conta existe, quantas tentativas falhas acumulou, e quando o
--   lockout expira. Isso e enumeracao de contas + exposicao de estado de seguranca interno.
-- FIX: revogar PUBLIC/anon, manter apenas authenticated + service_role.
--   reset_failed_attempts ja foi restringido a "proprio usuario" em 20260904000500,
--   entao o acesso de authenticated a get_lockout_details tambem nao e necessario para
--   uso normal — mas e mantido caso a Edge Function de login o utilize diretamente.
--   Se for removido de authenticated tambem, adicionar REVOKE adicional abaixo.

REVOKE EXECUTE ON FUNCTION public.get_lockout_details(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_lockout_details(text) FROM anon;
-- authenticated: manter (Edge Functions de auth usam role authenticated)
-- service_role: SECURITY DEFINER ja bypassa, mas explicitar nao faz mal
