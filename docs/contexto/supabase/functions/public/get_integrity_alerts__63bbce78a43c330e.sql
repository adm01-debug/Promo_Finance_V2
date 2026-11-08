CREATE OR REPLACE FUNCTION public.get_integrity_alerts(p_limit integer DEFAULT 100, p_incluir_resolvidos boolean DEFAULT false)
 RETURNS TABLE(id uuid, domain text, invariant text, severity text, affected_count bigint, reason text, sample_ids uuid[], alert_hour timestamp with time zone, resolved_at timestamp with time zone, resolved_reason text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
$function$
