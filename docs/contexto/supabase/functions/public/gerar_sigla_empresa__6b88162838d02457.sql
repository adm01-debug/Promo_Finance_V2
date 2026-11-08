CREATE OR REPLACE FUNCTION public.gerar_sigla_empresa(_nome text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT upper(
    substring(
      regexp_replace(coalesce(_nome, 'EMP'), '[^a-zA-Z0-9]', '', 'g')
      from 1 for 3
    )
  );
$function$
