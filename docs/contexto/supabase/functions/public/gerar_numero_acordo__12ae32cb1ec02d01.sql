CREATE OR REPLACE FUNCTION public.gerar_numero_acordo()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    RETURN 'AC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
END;
$function$
