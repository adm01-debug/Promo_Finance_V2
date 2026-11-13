CREATE OR REPLACE FUNCTION public.gate_34_indices_nao_utilizados(_min_dias integer DEFAULT 30)
 RETURNS TABLE(tabela text, indice text, dias_observados integer, tamanho_kb bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  WITH janela AS (
    SELECT index_name,
           max(table_name)  AS table_name,
           max(idx_scan)    AS scans_max,
           min(idx_scan)    AS scans_min,
           max(size_bytes)  AS size_bytes,
           bool_or(is_unique OR is_primary) AS protegido,
           (max(snapshot_date) - min(snapshot_date))::int AS dias
    FROM public.index_usage_snapshots
    WHERE snapshot_date >= CURRENT_DATE - (_min_dias * 2)
    GROUP BY index_name
  )
  SELECT j.table_name,
         j.index_name,
         j.dias,
         (j.size_bytes / 1024)::bigint
  FROM janela j
  WHERE NOT j.protegido
    AND j.dias >= _min_dias
    AND j.scans_max = 0
    AND j.scans_min = 0
    AND NOT EXISTS (
      SELECT 1 FROM public.indices_uso_excecoes e WHERE e.index_name = j.index_name
    )
    AND EXISTS (
      SELECT 1 FROM pg_indexes p
      WHERE p.schemaname = 'public' AND p.indexname = j.index_name
    )
$function$
