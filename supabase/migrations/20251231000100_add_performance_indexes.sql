-- Migration: add-performance-indexes
-- Criado: 31/12/2025
-- Objetivo: Melhorar performance de queries críticas

-- Índices simples
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento 
  ON contas_pagar(vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_status 
  ON contas_pagar(status);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor 
  ON contas_pagar(fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente 
  ON contas_receber(cliente_id);

CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento 
  ON contas_receber(vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_receber_status 
  ON contas_receber(status);

CREATE INDEX IF NOT EXISTS idx_nfe_data_emissao 
  ON notas_fiscais(data_emissao);

CREATE INDEX IF NOT EXISTS idx_nfe_numero 
  ON notas_fiscais(numero);

CREATE INDEX IF NOT EXISTS idx_conciliacao_data 
  ON conciliacao_bancaria(data_transacao);

CREATE INDEX IF NOT EXISTS idx_boletos_vencimento 
  ON boletos(vencimento);

-- Índices compostos (mais eficientes para queries comuns)
CREATE INDEX IF NOT EXISTS idx_cp_status_vencimento 
  ON contas_pagar(status, vencimento);

CREATE INDEX IF NOT EXISTS idx_cp_fornecedor_status 
  ON contas_pagar(fornecedor_id, status);

CREATE INDEX IF NOT EXISTS idx_cr_cliente_status 
  ON contas_receber(cliente_id, status);

CREATE INDEX IF NOT EXISTS idx_cr_status_vencimento 
  ON contas_receber(status, vencimento);

-- Índices para full-text search
CREATE INDEX IF NOT EXISTS idx_cp_descricao_gin 
  ON contas_pagar USING gin(to_tsvector('portuguese', descricao));

CREATE INDEX IF NOT EXISTS idx_cr_descricao_gin 
  ON contas_receber USING gin(to_tsvector('portuguese', descricao));

-- Índices parciais (apenas registros ativos)
CREATE INDEX IF NOT EXISTS idx_cp_pendentes 
  ON contas_pagar(vencimento) 
  WHERE status IN ('pendente', 'vencida');

CREATE INDEX IF NOT EXISTS idx_cr_pendentes 
  ON contas_receber(vencimento) 
  WHERE status IN ('pendente', 'vencida');

-- Analyze tables para atualizar estatísticas
ANALYZE contas_pagar;
ANALYZE contas_receber;
ANALYZE notas_fiscais;
ANALYZE boletos;
ANALYZE conciliacao_bancaria;

COMMENT ON INDEX idx_contas_pagar_vencimento IS 'Otimiza queries por vencimento';
COMMENT ON INDEX idx_cp_status_vencimento IS 'Otimiza listagem de contas por status e vencimento';
