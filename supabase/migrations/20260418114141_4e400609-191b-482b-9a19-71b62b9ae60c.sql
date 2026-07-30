-- Tabela de logs estruturados das edge functions
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  event TEXT NOT NULL,
  duration_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_logs_fn_created
  ON public.edge_function_logs (function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_logs_level_created
  ON public.edge_function_logs (level, created_at DESC);

ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar logs de edge functions"
  ON public.edge_function_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role pode inserir logs"
  ON public.edge_function_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- View de saúde agregada (últimos 7 dias)
CREATE OR REPLACE VIEW public.vw_edge_health
WITH (security_invoker = true)
AS
SELECT
  function_name,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE level = 'error') AS error_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE level = 'error') / NULLIF(COUNT(*), 0),
    2
  ) AS error_rate_pct,
  ROUND(
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::numeric,
    0
  ) AS p50_ms,
  ROUND(
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric,
    0
  ) AS p95_ms,
  MAX(created_at) AS last_call_at
FROM public.edge_function_logs
WHERE created_at >= now() - INTERVAL '7 days'
GROUP BY function_name
ORDER BY total_calls DESC;