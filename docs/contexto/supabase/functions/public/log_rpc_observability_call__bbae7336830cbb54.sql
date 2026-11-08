CREATE OR REPLACE FUNCTION public.log_rpc_observability_call(_function_name text, _duration_ms numeric, _success boolean, _error_sqlstate text DEFAULT NULL::text, _error_message text DEFAULT NULL::text, _meta jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _role TEXT := current_setting('request.jwt.claim.role', true);
BEGIN
  INSERT INTO public.rpc_observability_metrics(
    function_name, caller_user_id, caller_role,
    duration_ms, success, error_sqlstate, error_message, meta
  ) VALUES (
    _function_name, _uid, COALESCE(_role, current_user::text),
    _duration_ms, _success, _error_sqlstate, _error_message, COALESCE(_meta,'{}'::jsonb)
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$function$
