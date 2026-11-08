CREATE OR REPLACE FUNCTION public.faixa_simples_reparticao_valida(p_reparticao jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT COALESCE((
    SELECT
      (ABS(SUM(COALESCE(v::numeric, 0)) - 100.0) < 0.51)
      OR
      (ABS(SUM(COALESCE(v::numeric, 0)) -   1.0) < 0.02)
    FROM jsonb_each_text(p_reparticao) j(k, v)
  ), false);
$function$
