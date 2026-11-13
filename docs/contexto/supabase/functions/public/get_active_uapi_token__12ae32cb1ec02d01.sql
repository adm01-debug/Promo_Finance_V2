CREATE OR REPLACE FUNCTION public.get_active_uapi_token()
 RETURNS TABLE(access_token text, refresh_token text, user_fid text, token_age_hours numeric, needs_refresh boolean)
 LANGUAGE sql
 STABLE
AS $function$ SELECT null::text, null::text, null::text, null::numeric, null::boolean WHERE false $function$
