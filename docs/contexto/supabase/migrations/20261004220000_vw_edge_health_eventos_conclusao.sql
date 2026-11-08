CREATE OR REPLACE VIEW public.vw_edge_health
WITH (security_invoker = true) AS
SELECT
  l.function_name,
  COUNT(*)::bigint AS total_calls,
  COUNT(*) FILTER (WHERE l.level = 'error' OR l.error_message IS NOT NULL OR l.status_code >= 500)::bigint AS error_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE l.level = 'error' OR l.error_message IS NOT NULL OR l.status_code >= 500) / NULLIF(COUNT(*), 0), 2) AS error_rate_pct,
  ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY l.duration_ms))::numeric, 2) AS p50_ms,
  ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY l.duration_ms))::numeric, 2) AS p95_ms,
  MAX(l.created_at) AS last_call_at
FROM public.edge_function_logs l
WHERE l.created_at >= now() - INTERVAL '24 hours'
  AND l.event IN ('request_end', 'request_error')
GROUP BY l.function_name;

GRANT SELECT ON public.vw_edge_health TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
