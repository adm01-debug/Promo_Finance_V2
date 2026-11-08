CREATE OR REPLACE FUNCTION public.fe_error_signature(p_message text, p_component text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$ SELECT md5(coalesce(p_component,'')||'|'||coalesce(left(p_message,500),'')) $function$
