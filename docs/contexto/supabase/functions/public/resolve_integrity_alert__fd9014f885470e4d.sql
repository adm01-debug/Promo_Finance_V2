CREATE OR REPLACE FUNCTION public.resolve_integrity_alert(p_alert_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_rows integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.integrity_alerts
  SET resolved_at = now(),
      resolved_by = auth.uid(),
      resolved_reason = 'manual: encerrado por administrador'
  WHERE id = p_alert_id
    AND resolved_at IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$function$
