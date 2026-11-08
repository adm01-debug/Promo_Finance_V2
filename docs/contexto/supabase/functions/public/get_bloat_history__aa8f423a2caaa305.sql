CREATE OR REPLACE FUNCTION public.get_bloat_history(p_days integer DEFAULT 30)
 RETURNS TABLE(id uuid, table_name text, dead_ratio_pct integer, severity text, details text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar histórico de bloat.';
  END IF;

  RETURN QUERY
  SELECT qt.id, qt.table_name, qt.duration_ms AS dead_ratio_pct,
         qt.severity, qt.error_message AS details, qt.created_at
  FROM public.query_telemetry qt
  WHERE qt.operation = 'bloat_monitor'
    AND qt.created_at > now() - make_interval(days => GREATEST(p_days, 1))
  ORDER BY qt.created_at DESC
  LIMIT 5000;
END;
$function$
