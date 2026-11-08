CREATE OR REPLACE FUNCTION public.sanitize_auth_log_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Remove potentially sensitive fields from metadata
  IF NEW.metadata IS NOT NULL THEN
    NEW.metadata = NEW.metadata - 'password' - 'secret' - 'token' - 'api_key' - 'security_answer' - 'otp_code';
  END IF;
  RETURN NEW;
END;
$function$
