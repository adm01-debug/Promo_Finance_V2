CREATE OR REPLACE FUNCTION public.set_token_expiration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Definir expiração para 24 horas se não especificado
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '24 hours';
  END IF;
  
  -- Garantir que expiração máxima seja 24 horas
  IF NEW.expires_at > now() + interval '24 hours' THEN
    NEW.expires_at := now() + interval '24 hours';
  END IF;
  
  RETURN NEW;
END;
$function$
