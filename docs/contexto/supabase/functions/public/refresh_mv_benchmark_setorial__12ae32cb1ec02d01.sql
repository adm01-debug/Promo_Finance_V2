CREATE OR REPLACE FUNCTION public.refresh_mv_benchmark_setorial()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF to_regclass('public.mv_benchmark_setorial') IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_benchmark_setorial;
  EXCEPTION
    WHEN feature_not_supported THEN
      -- CONCURRENTLY exige view já populada; só neste caso cai no bloqueante.
      REFRESH MATERIALIZED VIEW public.mv_benchmark_setorial;
  END;
END;
$function$
