-- Dashboard Metrics View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_metrics AS
SELECT 
  DATE_TRUNC('month', vencimento) as mes,
  status,
  COUNT(*) as quantidade,
  SUM(valor) as total_valor
FROM contas_pagar
GROUP BY DATE_TRUNC('month', vencimento), status;
