CREATE OR REPLACE FUNCTION public.mascarar_chave_pix(p_chave text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$ SELECT CASE WHEN p_chave IS NULL THEN NULL WHEN length(p_chave) <= 8 THEN repeat('*', length(p_chave)) ELSE left(p_chave, 4) || repeat('*', length(p_chave) - 8) || right(p_chave, 4) END $function$
