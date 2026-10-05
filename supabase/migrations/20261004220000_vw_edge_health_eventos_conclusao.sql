-- vw_edge_health passa a contar apenas eventos de conclusão de requisição.
--
-- Com o wrapper withEdgeObservability toda requisição emite exatamente um
-- 'request_end' (sucesso) ou 'request_error' (exceção), com duration_ms e
-- status_code. Antes disso a view agregava TODAS as linhas de
-- edge_function_logs — handlers que já registravam eventos próprios na
-- mesma tabela (ex.: 'request' do trampolim, logs intermediários) inflavam
-- total_calls, distorciam a taxa de erro e o percentil de duração.
-- Os eventos legados continuam na tabela, só não contam como chamada.

CREATE OR REPLACE VIEW public.vw_edge_health
WITH (security_invoker = true) AS
SELECT
  l.function_name,
  COUNT(*)::bigint AS total_calls,
  -- Falha = erro de servidor: 4xx é resposta normal de validação/auth e
  -- não pode inflar a taxa de erro nem acionar alertas de SLO.
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
