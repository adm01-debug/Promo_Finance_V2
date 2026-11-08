CREATE OR REPLACE FUNCTION public.cleanup_pgss_baseline(p_days integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.pg_stat_statements_baseline
   WHERE captured_at < now() - make_interval(days => GREATEST(p_days, 7));
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$
