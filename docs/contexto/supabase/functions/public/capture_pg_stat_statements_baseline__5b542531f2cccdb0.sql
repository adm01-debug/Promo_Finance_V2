CREATE OR REPLACE FUNCTION public.capture_pg_stat_statements_baseline(p_label text)
 RETURNS TABLE(captured_rows bigint, label text, captured_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_captured_at TIMESTAMPTZ := now();
  v_count BIGINT;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.pg_stat_statements_baseline (
    label, queryid, query, calls, total_exec_time, mean_exec_time,
    max_exec_time, rows, shared_blks_hit, shared_blks_read, captured_at
  )
  SELECT p_label, s.queryid, LEFT(s.query, 2000), s.calls, s.total_exec_time,
         s.mean_exec_time, s.max_exec_time, s.rows, s.shared_blks_hit,
         s.shared_blks_read, v_captured_at
  FROM extensions.pg_stat_statements s
  WHERE s.dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
    AND s.query NOT ILIKE '%pg_stat_statements%';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count, p_label, v_captured_at;
END;
$function$
