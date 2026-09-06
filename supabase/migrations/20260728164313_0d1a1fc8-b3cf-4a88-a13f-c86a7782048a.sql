CREATE OR REPLACE VIEW public.vw_edge_health
WITH (security_invoker = true) AS
SELECT
  l.function_name,
  COUNT(*)::bigint AS total_calls,
  COUNT(*) FILTER (WHERE l.level = 'error' OR l.error_message IS NOT NULL OR l.status_code >= 400)::bigint AS error_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE l.level = 'error' OR l.error_message IS NOT NULL OR l.status_code >= 400)
    / NULLIF(COUNT(*), 0), 2
  ) AS error_rate_pct,
  ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY l.duration_ms))::numeric, 2) AS p50_ms,
  ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY l.duration_ms))::numeric, 2) AS p95_ms,
  MAX(l.created_at) AS last_call_at
FROM public.edge_function_logs l
WHERE l.created_at >= now() - INTERVAL '24 hours'
GROUP BY l.function_name;

GRANT SELECT ON public.vw_edge_health TO authenticated;
GRANT SELECT ON public.vw_edge_health TO service_role;

DROP VIEW IF EXISTS public.vw_transferencias_painel CASCADE;
CREATE OR REPLACE VIEW public.vw_transferencias_painel
WITH (security_invoker = true) AS
SELECT
  t.id,
  t.empresa_id,
  e.razao_social,
  t.asaas_id,
  t.valor,
  t.status,
  t.tipo_chave,
  t.chave_pix,
  t.descricao,
  t.created_at,
  t.updated_at
FROM public.asaas_transfers t
LEFT JOIN public.empresas e ON e.id = t.empresa_id;

GRANT SELECT ON public.vw_transferencias_painel TO authenticated;
GRANT SELECT ON public.vw_transferencias_painel TO service_role;
