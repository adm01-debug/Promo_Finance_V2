CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_deleted integer;
BEGIN
  -- Deletar tokens expirados
  DELETE FROM password_reset_tokens
  WHERE expires_at < now();
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Também limpar tokens usados há mais de 7 dias
  DELETE FROM password_reset_tokens
  WHERE used_at IS NOT NULL 
    AND used_at < now() - interval '7 days';
  
  RETURN v_deleted;
END;
$function$
