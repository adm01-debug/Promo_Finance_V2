CREATE OR REPLACE FUNCTION public.sincronizar_conta_partida()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  NEW.conta_contabil_id := COALESCE(NEW.conta_contabil_id, NEW.conta_id);
  NEW.conta_id := COALESCE(NEW.conta_id, NEW.conta_contabil_id);
  RETURN NEW;
END;
$function$
