CREATE OR REPLACE FUNCTION public.normalizar_tipo_partida()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.tipo IS NOT NULL THEN
    NEW.tipo = UPPER(NEW.tipo);
  END IF;
  RETURN NEW;
END;
$function$
