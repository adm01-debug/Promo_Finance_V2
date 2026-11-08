CREATE OR REPLACE FUNCTION public.get_performance_alerts(p_days integer DEFAULT 7, p_severity text DEFAULT NULL::text, p_source text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, source text, alert_key text, alert_hour timestamp with time zone, severity text, reason text, current_value numeric, baseline_value numeric, ratio numeric, sample_count integer, query_snippet text, metadata jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar alertas de performance.';
  END IF;

  RETURN QUERY
  SELECT a.id, a.source, a.alert_key, a.alert_hour, a.severity, a.reason,
         a.current_value, a.baseline_value, a.ratio, a.sample_count,
         a.query_snippet, a.metadata, a.created_at
  FROM public.performance_alerts a
  WHERE a.created_at > now() - make_interval(days => GREATEST(p_days, 1))
    AND (p_severity IS NULL OR a.severity = p_severity)
    AND (p_source IS NULL OR a.source = p_source)
  ORDER BY
    CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
    a.created_at DESC
  LIMIT 500;
END;
$function$
