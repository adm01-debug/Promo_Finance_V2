CREATE OR REPLACE FUNCTION public.escalate_stale_integrity_alerts()
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE v int;
BEGIN
  UPDATE public.integrity_alerts SET severity='HIGH'
  WHERE severity='LOW' AND resolved_at IS NULL AND created_at < now()-interval '48 hours';
  GET DIAGNOSTICS v=ROW_COUNT;
  RETURN jsonb_build_object('escalated',v);
END;
$function$
