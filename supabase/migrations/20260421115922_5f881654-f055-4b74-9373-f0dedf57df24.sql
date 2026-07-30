
DROP POLICY IF EXISTS "Sistema insere tentativas SSO" ON public.sso_login_attempts;

-- Função SECURITY DEFINER para registro controlado
CREATE OR REPLACE FUNCTION public.registrar_tentativa_sso(
  _provider_id UUID,
  _email TEXT,
  _success BOOLEAN,
  _error_code TEXT DEFAULT NULL,
  _error_message TEXT DEFAULT NULL,
  _ip TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.sso_login_attempts (
    provider_id, email, success, error_code, error_message,
    ip_address, user_agent, duration_ms
  ) VALUES (
    _provider_id, _email, _success, _error_code, _error_message,
    _ip, _user_agent, _duration_ms
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_tentativa_sso(UUID,TEXT,BOOLEAN,TEXT,TEXT,TEXT,TEXT,INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_tentativa_sso(UUID,TEXT,BOOLEAN,TEXT,TEXT,TEXT,TEXT,INTEGER) TO authenticated, anon;
