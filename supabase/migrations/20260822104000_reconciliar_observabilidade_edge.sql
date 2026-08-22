-- Reconciliação do banco canônico: observabilidade de Edge Functions.
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  event text,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  error_message text,
  duration_ms integer,
  status_code integer,
  user_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.edge_function_logs TO authenticated;
GRANT ALL ON public.edge_function_logs TO service_role;

DROP POLICY IF EXISTS "edge_function_logs_admin_select" ON public.edge_function_logs;
CREATE POLICY "edge_function_logs_admin_select"
  ON public.edge_function_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_edge_logs_created
  ON public.edge_function_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_logs_level
  ON public.edge_function_logs (level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_logs_function
  ON public.edge_function_logs (function_name, created_at DESC);

CREATE OR REPLACE VIEW public.vw_edge_health
WITH (security_invoker = true) AS
SELECT
  l.function_name,
  COUNT(*)::bigint AS total_calls,
  COUNT(*) FILTER (WHERE l.level = 'error' OR l.error_message IS NOT NULL OR l.status_code >= 400)::bigint AS error_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE l.level = 'error' OR l.error_message IS NOT NULL OR l.status_code >= 400) / NULLIF(COUNT(*), 0), 2) AS error_rate_pct,
  ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY l.duration_ms))::numeric, 2) AS p50_ms,
  ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY l.duration_ms))::numeric, 2) AS p95_ms,
  MAX(l.created_at) AS last_call_at
FROM public.edge_function_logs l
WHERE l.created_at >= now() - INTERVAL '24 hours'
GROUP BY l.function_name;

GRANT SELECT ON public.vw_edge_health TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
