CREATE OR REPLACE FUNCTION public.close_stale_integrity_alerts()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE v int;
BEGIN
  UPDATE public.integrity_alerts SET resolved_at=now()
  WHERE resolved_at IS NULL AND created_at < now()-interval '7 days';
  GET DIAGNOSTICS v=ROW_COUNT; RETURN v;
END;
$function$
