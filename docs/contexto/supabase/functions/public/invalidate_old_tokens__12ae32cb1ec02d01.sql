CREATE OR REPLACE FUNCTION public.invalidate_old_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Marcar tokens anteriores como expirados
  UPDATE password_reset_tokens
  SET expires_at = now() - interval '1 second'
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND used_at IS NULL
    AND expires_at > now();
  
  RETURN NEW;
END;
$function$
