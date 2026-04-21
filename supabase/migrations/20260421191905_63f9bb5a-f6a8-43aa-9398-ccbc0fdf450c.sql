-- Adiciona colunas de telemetria do onboarding
ALTER TABLE public.sso_login_attempts
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_email_created
  ON public.sso_login_attempts (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_event_type_created
  ON public.sso_login_attempts (event_type, created_at DESC);

-- RPC para registrar eventos do onboarding (executável por anon e authenticated)
CREATE OR REPLACE FUNCTION public.log_sso_onboarding_event(
  _email text,
  _event_type text,
  _provider_id uuid DEFAULT NULL,
  _context jsonb DEFAULT '{}'::jsonb,
  _success boolean DEFAULT true,
  _error_code text DEFAULT NULL,
  _error_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF _event_type NOT IN (
    'domain_resolved','auto_redirect_started','auto_redirect_cancelled',
    'manual_provider_selected','redirect_dispatched','redirect_failed',
    'password_fallback_used'
  ) THEN
    RAISE EXCEPTION 'event_type inválido: %', _event_type;
  END IF;

  INSERT INTO public.sso_login_attempts(
    provider_id, email, success, error_code, error_message,
    event_type, context
  ) VALUES (
    _provider_id,
    NULLIF(lower(trim(COALESCE(_email,''))), ''),
    _success,
    _error_code,
    _error_message,
    _event_type,
    COALESCE(_context, '{}'::jsonb)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_sso_onboarding_event(text, text, uuid, jsonb, boolean, text, text) TO anon, authenticated;