CREATE OR REPLACE FUNCTION public.get_retencao_politicas_status()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT jsonb_agg(jsonb_build_object(
    'tabela', tabela,
    'coluna', coluna,
    'dias', dias,
    'ativo', ativo,
    'motivo', motivo
  ) ORDER BY tabela)
  FROM public.retencao_politicas
$function$
