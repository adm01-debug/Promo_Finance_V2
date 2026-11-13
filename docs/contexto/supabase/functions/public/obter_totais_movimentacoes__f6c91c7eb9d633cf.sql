CREATE OR REPLACE FUNCTION public.obter_totais_movimentacoes(p_start date, p_end date, p_tipo text DEFAULT NULL::text, p_search text DEFAULT NULL::text)
 RETURNS TABLE(total_entradas numeric, total_saidas numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS total_entradas,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS total_saidas
  FROM movimentacoes
  WHERE deleted_at IS NULL
    AND origem IS DISTINCT FROM 'transferencia'
    AND data_movimentacao >= p_start
    AND data_movimentacao <= p_end
    AND (p_tipo IS NULL OR p_tipo = 'all' OR tipo = p_tipo)
    AND (p_search IS NULL OR p_search = '' OR descricao ILIKE '%' || p_search || '%');
$function$
