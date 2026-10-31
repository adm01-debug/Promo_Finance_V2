-- Step 15: FK indexes em contas_pagar e contas_receber
-- Verificado via pg_indexes: todos os índices de FK já existem nestas tabelas.
-- contas_pagar: empresa_id ✓, categoria_id ✓, fornecedor_id ✓, conta_bancaria_id ✓, centro_custo_id ✓
-- contas_receber: empresa_id ✓, cliente_id ✓, categoria_id ✓, conta_bancaria_id ✓, centro_custo_id ✓
-- Idempotente via IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_id ON contas_pagar (empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_categoria_id ON contas_pagar (categoria_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor_id ON contas_pagar (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_conta_bancaria_id ON contas_pagar (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_id ON contas_receber (empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente_id ON contas_receber (cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_categoria_id ON contas_receber (categoria_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_conta_bancaria_id ON contas_receber (conta_bancaria_id);
