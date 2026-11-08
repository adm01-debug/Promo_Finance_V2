CREATE OR REPLACE FUNCTION public.log_sso_onboarding_event(_email text, _event_type text, _provider_id text DEFAULT NULL::text, _context jsonb DEFAULT '{}'::jsonb, _success boolean DEFAULT true, _error_code text DEFAULT NULL::text, _error_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    INSERT INTO public.sso_login_attempts (
        email,
        event_type,
        provider_id,
        context,
        success,
        error_code,
        error_message
    ) VALUES (
        _email,
        _event_type,
        _provider_id,
        _context,
        _success,
        _error_code,
        _error_message
    );
END;
$function$
