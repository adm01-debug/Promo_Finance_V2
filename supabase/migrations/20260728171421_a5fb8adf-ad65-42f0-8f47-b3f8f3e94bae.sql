-- 1) Políticas explícitas (deny-all para clientes, acesso apenas service_role)
CREATE POLICY "bling_tokens_service_role_only"
  ON public.bling_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "bitrix_oauth_tokens_service_role_only"
  ON public.bitrix_oauth_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.bling_tokens FROM anon, authenticated;
REVOKE ALL ON public.bitrix_oauth_tokens FROM anon, authenticated;
GRANT ALL ON public.bling_tokens TO service_role;
GRANT ALL ON public.bitrix_oauth_tokens TO service_role;

-- 2) Reduzir superfície de execução de funções SECURITY DEFINER não usadas pelo cliente
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_catalogos_tributarios_invariants() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recarregar_seeds_fiscais(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.detectar_duplicidades_financeiras(uuid, text) FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_catalogos_tributarios_invariants() TO service_role;
GRANT EXECUTE ON FUNCTION public.recarregar_seeds_fiscais(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.detectar_duplicidades_financeiras(uuid, text) TO service_role;