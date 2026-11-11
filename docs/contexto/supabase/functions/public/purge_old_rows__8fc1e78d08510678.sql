CREATE OR REPLACE FUNCTION public.purge_old_rows(p_table text, p_column text DEFAULT 'created_at'::text, p_days integer DEFAULT 90)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE v bigint;
BEGIN
  EXECUTE format('DELETE FROM public.%I WHERE %I < now()-interval ''%s days''',p_table,p_column,p_days);
  GET DIAGNOSTICS v=ROW_COUNT; RETURN v;
END;
$function$
