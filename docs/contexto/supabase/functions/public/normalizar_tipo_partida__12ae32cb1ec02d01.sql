CREATE OR REPLACE FUNCTION public.normalizar_tipo_partida()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  -- A constraint partidas_contabeis_tipo_check só aceita 'debito'/'credito'.
  IF NEW.tipo IS NOT NULL THEN
    NEW.tipo = LOWER(NEW.tipo);
  END IF;
  RETURN NEW;
END;
$function$
