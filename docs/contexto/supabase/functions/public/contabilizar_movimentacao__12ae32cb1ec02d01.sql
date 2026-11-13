CREATE OR REPLACE FUNCTION public.contabilizar_movimentacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  PERFORM public.contabilizar_movimentacao_registro(NEW);
  RETURN NULL;
END;
$function$
