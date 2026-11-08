CREATE OR REPLACE FUNCTION public.capture_index_usage_snapshot()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_linhas integer;
BEGIN
  INSERT INTO public.index_usage_snapshots (
    snapshot_date, schema_name, table_name, index_name,
    idx_scan, size_bytes, is_unique, is_primary
  )
  SELECT current_date,
         s.schemaname,
         s.relname,
         s.indexrelname,
         s.idx_scan,
         pg_relation_size(s.indexrelid),
         i.indisunique,
         i.indisprimary
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON i.indexrelid = s.indexrelid
  WHERE s.schemaname = 'public'
  ON CONFLICT (snapshot_date, schema_name, index_name) DO UPDATE
     SET idx_scan = EXCLUDED.idx_scan,
         size_bytes = EXCLUDED.size_bytes;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;

  DELETE FROM public.index_usage_snapshots
  WHERE snapshot_date < current_date - interval '180 days';

  RETURN v_linhas;
END
$function$
