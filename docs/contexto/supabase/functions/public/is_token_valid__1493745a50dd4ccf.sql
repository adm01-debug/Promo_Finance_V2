CREATE OR REPLACE FUNCTION public.is_token_valid(p_token_hash text)
 RETURNS TABLE(is_valid boolean, user_id uuid, expires_in_seconds integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_record password_reset_tokens%ROWTYPE;
BEGIN
  SELECT * INTO v_record
  FROM password_reset_tokens
  WHERE token_hash = p_token_hash
    AND expires_at > now()
    AND used_at IS NULL
  LIMIT 1;
  
  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 0;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true,
    v_record.user_id,
    EXTRACT(EPOCH FROM (v_record.expires_at - now()))::integer;
END;
$function$
