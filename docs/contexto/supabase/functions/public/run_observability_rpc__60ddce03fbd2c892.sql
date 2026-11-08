CREATE OR REPLACE FUNCTION public.run_observability_rpc(_function_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _t0 TIMESTAMPTZ := clock_timestamp();
  _dur NUMERIC;
  _allowed TEXT[] := ARRAY[
    'monitor_table_bloat',
    'snapshot_table_bloat',
    'refresh_performance_alerts_weekly',
    'sefaz_run_observability_checks',
    'capture_pg_stat_statements_baseline',
    'capture_slow_queries'
  ];
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF NOT (_function_name = ANY(_allowed)) THEN
    RAISE EXCEPTION 'function % not allowed', _function_name;
  END IF;

  EXECUTE format('SELECT public.%I()', _function_name);

  _dur := EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000;
  PERFORM public.log_rpc_observability_call(
    _function_name, _dur, true, NULL, NULL, jsonb_build_object('via','run_observability_rpc'));
EXCEPTION WHEN OTHERS THEN
  _dur := EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000;
  PERFORM public.log_rpc_observability_call(
    _function_name, _dur, false, SQLSTATE, SQLERRM, jsonb_build_object('via','run_observability_rpc'));
  RAISE;
END;
$function$
