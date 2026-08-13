-- Melhoria #7: restaurar descoberta de SSO pré-login sem ampliar superfície de ataque
REVOKE ALL ON FUNCTION public.resolve_sso_providers_for_domain(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_sso_providers_for_domain(text) TO anon, authenticated, service_role;