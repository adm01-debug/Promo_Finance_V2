CREATE OR REPLACE FUNCTION public.cleanup_rpc_observability_metrics()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _deleted INTEGER;
BEGIN
  DELETE FROM public.rpc_observability_metrics
   WHERE called_at < now() - interval '30 days';
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted;
END;
$function$
