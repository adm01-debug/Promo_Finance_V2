CREATE OR REPLACE FUNCTION public.lancamento_contabil_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  IF NEW.created_at IS NULL THEN NEW.created_at = now(); END IF;
  RETURN NEW;
END;
$function$
