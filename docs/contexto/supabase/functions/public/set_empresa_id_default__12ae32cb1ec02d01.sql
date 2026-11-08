CREATE OR REPLACE FUNCTION public.set_empresa_id_default()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NEW.empresa_id IS NULL THEN NEW.empresa_id := public.empresa_padrao_id(); END IF;
  RETURN NEW;
END;$function$
