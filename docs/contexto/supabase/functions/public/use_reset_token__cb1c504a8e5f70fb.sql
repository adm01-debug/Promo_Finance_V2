CREATE OR REPLACE FUNCTION public.use_reset_token(p_token_hash text, p_ip_address inet DEFAULT NULL::inet)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_updated integer;
BEGIN
  UPDATE password_reset_tokens
  SET 
    used_at = now(),
    ip_address = COALESCE(p_ip_address, password_reset_tokens.ip_address)
  WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND used_at IS NULL;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN v_updated > 0;
END;
$function$
