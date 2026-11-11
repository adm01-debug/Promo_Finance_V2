CREATE OR REPLACE FUNCTION public.lancamento_contabil_before_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  RETURN NEW; -- lancamentos_contabeis sem updated_at no V2
END;
$function$
