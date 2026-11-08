CREATE OR REPLACE FUNCTION public.get_table_bloat()
 RETURNS TABLE(schemaname name, table_name name, live_rows bigint, dead_rows bigint, dead_ratio_pct numeric, total_size_pretty text, total_size_bytes bigint, table_size_pretty text, last_vacuum timestamp with time zone, last_autovacuum timestamp with time zone, last_analyze timestamp with time zone, last_autoanalyze timestamp with time zone, vacuum_count bigint, autovacuum_count bigint, analyze_count bigint, autoanalyze_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar bloat.';
  END IF;

  RETURN QUERY
  SELECT v.schemaname, v.table_name, v.live_rows, v.dead_rows, v.dead_ratio_pct,
         v.total_size_pretty, v.total_size_bytes, v.table_size_pretty,
         v.last_vacuum, v.last_autovacuum, v.last_analyze, v.last_autoanalyze,
         v.vacuum_count, v.autovacuum_count, v.analyze_count, v.autoanalyze_count
  FROM public.v_table_bloat v
  ORDER BY v.dead_ratio_pct DESC NULLS LAST, v.total_size_bytes DESC;
END;
$function$
