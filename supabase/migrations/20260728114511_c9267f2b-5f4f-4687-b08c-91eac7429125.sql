DROP FUNCTION IF EXISTS public.get_integrity_alerts(integer, boolean);
DROP FUNCTION IF EXISTS public.get_integrity_alerts(integer);
DROP FUNCTION IF EXISTS public.get_integrity_alerts();

CREATE OR REPLACE FUNCTION public.get_integrity_alerts(
  p_limit integer DEFAULT 100,
  p_incluir_resolvidos boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  domain text,
  invariant text,
  severity text,
  affected_count bigint,
  reason text,
  sample_ids uuid[],
  alert_hour timestamptz,
  resolved_at timestamptz,
  resolved_reason text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT a.id, a.domain, a.invariant, a.severity, a.affected_count, a.reason,
         a.sample_ids, a.alert_hour, a.resolved_at, a.resolved_reason, a.created_at
  FROM public.integrity_alerts a
  WHERE (p_incluir_resolvidos OR a.resolved_at IS NULL)
  ORDER BY (a.resolved_at IS NOT NULL), a.alert_hour DESC, a.severity
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
END;
$function$;

REVOKE ALL ON FUNCTION public.get_integrity_alerts(integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_integrity_alerts(integer, boolean) TO authenticated, service_role;

-- Resolução manual também registra o motivo
DROP FUNCTION IF EXISTS public.resolve_integrity_alert(uuid);

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
$function$;

REVOKE ALL ON FUNCTION public.resolve_integrity_alert(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_integrity_alert(uuid) TO authenticated, service_role;