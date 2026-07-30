-- Migration: add-materialized-views
-- Criado: 31/12/2025
-- Objetivo: Criar views materializadas para dashboards

-- View para métricas do dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_metrics AS
SELECT 
  DATE_TRUNC('month', vencimento) as mes,
  status,
  COUNT(*) as quantidade,
  SUM(valor) as total_valor,
  AVG(valor) as media_valor,
  MIN(valor) as min_valor,
  MAX(valor) as max_valor
FROM contas_pagar
WHERE vencimento >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', vencimento), status;

CREATE UNIQUE INDEX ON mv_dashboard_metrics (mes, status);

-- View para fluxo de caixa
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_fluxo_caixa AS
SELECT 
  DATE(vencimento) as data,
  SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas,
  SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as saidas,
  SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) as saldo
FROM (
  SELECT vencimento, valor, 'entrada' as tipo FROM contas_receber WHERE status = 'pago'
  UNION ALL
  SELECT vencimento, valor, 'saida' as tipo FROM contas_pagar WHERE status = 'pago'
) combined
WHERE vencimento >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY DATE(vencimento)
ORDER BY data;

CREATE UNIQUE INDEX ON mv_fluxo_caixa (data);

-- View para top fornecedores
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_fornecedores AS
SELECT 
  f.id,
  f.nome,
  COUNT(cp.id) as total_contas,
  SUM(cp.valor) as total_valor,
  AVG(cp.valor) as media_valor
FROM fornecedores f
LEFT JOIN contas_pagar cp ON cp.fornecedor_id = f.id
WHERE cp.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY f.id, f.nome
ORDER BY total_valor DESC
LIMIT 100;

CREATE UNIQUE INDEX ON mv_top_fornecedores (id);

-- View para análise de inadimplência
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inadimplencia AS
SELECT 
  cliente_id,
  COUNT(*) as contas_vencidas,
  SUM(valor) as valor_total_vencido,
  MIN(vencimento) as vencimento_mais_antigo,
  MAX(vencimento) as vencimento_mais_recente,
  DATE_PART('day', CURRENT_DATE - MIN(vencimento)) as dias_atraso_maximo
FROM contas_receber
WHERE status = 'vencida'
GROUP BY cliente_id
HAVING COUNT(*) > 0;

CREATE UNIQUE INDEX ON mv_inadimplencia (cliente_id);

-- Função para refresh automático
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fluxo_caixa;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_fornecedores;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inadimplencia;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para refresh automático (executar 1x por hora)
CREATE OR REPLACE FUNCTION schedule_view_refresh()
RETURNS void AS $$
BEGIN
  -- Executar refresh se última atualização > 1 hora
  PERFORM refresh_materialized_views();
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON MATERIALIZED VIEW mv_dashboard_metrics IS 'Métricas agregadas para dashboard';
COMMENT ON MATERIALIZED VIEW mv_fluxo_caixa IS 'Fluxo de caixa diário dos últimos 3 meses';
COMMENT ON MATERIALIZED VIEW mv_top_fornecedores IS 'Top 100 fornecedores por valor';
COMMENT ON MATERIALIZED VIEW mv_inadimplencia IS 'Análise de inadimplência por cliente';
