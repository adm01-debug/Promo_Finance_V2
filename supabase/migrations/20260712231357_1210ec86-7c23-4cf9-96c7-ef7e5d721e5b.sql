-- Hardening: revogar EXECUTE de anon/PUBLIC em funções SECURITY DEFINER
-- que não deveriam ser chamáveis diretamente pela Data API.

-- 1) Trigger function (nunca deve ser chamada por API)
REVOKE EXECUTE ON FUNCTION public.audit_trigger_generic() FROM anon, authenticated, PUBLIC;

-- 2) Diagnóstico/Manutenção — apenas admin via has_role check interno,
-- não precisam ser expostas ao anon nem PUBLIC
REVOKE EXECUTE ON FUNCTION public.cleanup_pgss_baseline(integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compare_pg_stat_baseline(text) FROM anon, PUBLIC;

-- 3) resolve_sso_providers_for_domain permanece com anon (pré-login SSO discovery) — intencional