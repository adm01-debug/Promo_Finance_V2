
CREATE OR REPLACE FUNCTION public.get_table_bloat()
RETURNS TABLE (
  schemaname name,
  table_name name,
  live_rows bigint,
  dead_rows bigint,
  dead_ratio_pct numeric,
  total_size_pretty text,
  total_size_bytes bigint,
  table_size_pretty text,
  last_vacuum timestamptz,
  last_autovacuum timestamptz,
  last_analyze timestamptz,
  last_autoanalyze timestamptz,
  vacuum_count bigint,
  autovacuum_count bigint,
  analyze_count bigint,
  autoanalyze_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_table_bloat() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_table_bloat() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_bloat_history(p_days integer DEFAULT 30)
RETURNS TABLE (
  id uuid,
  table_name text,
  dead_ratio_pct integer,
  severity text,
  details text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar histórico de bloat.';
  END IF;

  RETURN QUERY
  SELECT qt.id, qt.table_name, qt.duration_ms AS dead_ratio_pct,
         qt.severity, qt.error_message AS details, qt.created_at
  FROM public.query_telemetry qt
  WHERE qt.operation = 'bloat_monitor'
    AND qt.created_at > now() - make_interval(days => GREATEST(p_days, 1))
  ORDER BY qt.created_at DESC
  LIMIT 5000;
END;
$$;

REVOKE ALL ON FUNCTION public.get_bloat_history(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bloat_history(integer) TO authenticated;
