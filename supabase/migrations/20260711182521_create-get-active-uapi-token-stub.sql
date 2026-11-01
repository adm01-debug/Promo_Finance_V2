-- Shim: cria stub de get_active_uapi_token() antes de 20260711182522
-- que faz COMMENT ON FUNCTION public.get_active_uapi_token() (42883 — does not exist)
-- Função criada fora do sistema de migrations em produção; Preview não a tem.
CREATE OR REPLACE FUNCTION public.get_active_uapi_token()
RETURNS TABLE(access_token text, refresh_token text, user_fid text, token_age_hours numeric, needs_refresh boolean)
LANGUAGE sql STABLE AS $$ SELECT null::text, null::text, null::text, null::numeric, null::boolean WHERE false $$;
