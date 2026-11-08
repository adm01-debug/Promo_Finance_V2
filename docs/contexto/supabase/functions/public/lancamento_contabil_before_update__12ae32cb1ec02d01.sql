CREATE OR REPLACE FUNCTION public.lancamento_contabil_before_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN NEW; -- lancamentos_contabeis sem updated_at no V2
END;
$function$
