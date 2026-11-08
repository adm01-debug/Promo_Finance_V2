CREATE OR REPLACE FUNCTION public.get_bloat_snapshots(p_days integer DEFAULT 30, p_table_name text DEFAULT NULL::text)
 RETURNS TABLE(snapshot_date date, table_name text, live_rows bigint, dead_rows bigint, dead_ratio_pct numeric, total_size_bytes bigint, total_size_pretty text, last_autovacuum timestamp with time zone, autovacuum_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar snapshots de bloat.';
  END IF;

  RETURN QUERY
  SELECT s.snapshot_date, s.table_name, s.live_rows, s.dead_rows, s.dead_ratio_pct,
         s.total_size_bytes, s.total_size_pretty, s.last_autovacuum, s.autovacuum_count
  FROM public.bloat_snapshots s
  WHERE s.snapshot_date > CURRENT_DATE - make_interval(days => GREATEST(p_days, 1))
    AND (p_table_name IS NULL OR s.table_name = p_table_name)
  ORDER BY s.snapshot_date DESC, s.dead_ratio_pct DESC NULLS LAST;
END;
$function$
