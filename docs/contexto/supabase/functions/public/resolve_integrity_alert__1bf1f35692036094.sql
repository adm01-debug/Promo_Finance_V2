CREATE OR REPLACE FUNCTION public.resolve_integrity_alert(p_alert_id uuid, p_resolution text DEFAULT 'manual'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.integrity_alerts SET resolved_at=now(), resolved_by=auth.uid()
  WHERE id=p_alert_id AND resolved_at IS NULL;
  RETURN FOUND;
END;
$function$
