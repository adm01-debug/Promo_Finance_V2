CREATE OR REPLACE FUNCTION public.normalizar_tipo_partida()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  -- A constraint partidas_contabeis_tipo_check só aceita 'debito'/'credito'.
  IF NEW.tipo IS NOT NULL THEN
    NEW.tipo := CASE LOWER(BTRIM(NEW.tipo))
      WHEN 'd' THEN 'debito'   WHEN 'débito' THEN 'debito'
      WHEN 'c' THEN 'credito'  WHEN 'crédito' THEN 'credito'
      ELSE LOWER(BTRIM(NEW.tipo))
    END;
  END IF;
  RETURN NEW;
END;
$function$
