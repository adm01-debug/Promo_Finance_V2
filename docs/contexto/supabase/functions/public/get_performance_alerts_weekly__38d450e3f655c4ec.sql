CREATE OR REPLACE FUNCTION public.get_performance_alerts_weekly(p_weeks integer DEFAULT 12)
 RETURNS TABLE(week_start date, source text, severity text, alert_count bigint, distinct_keys bigint, avg_current_ms numeric, max_current_ms numeric, avg_ratio numeric, max_ratio numeric, total_samples numeric, delta_pct_vs_prev_week numeric, refreshed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar tendências.';
  END IF;

  RETURN QUERY
  SELECT mv.week_start, mv.source, mv.severity, mv.alert_count, mv.distinct_keys,
         mv.avg_current_ms, mv.max_current_ms, mv.avg_ratio, mv.max_ratio,
         mv.total_samples::numeric, mv.delta_pct_vs_prev_week, mv.refreshed_at
  FROM public.mv_performance_alerts_weekly mv
  WHERE mv.week_start > (now() - make_interval(weeks => GREATEST(p_weeks, 1)))::date
  ORDER BY mv.week_start DESC, mv.source, mv.severity;
END;
$function$
