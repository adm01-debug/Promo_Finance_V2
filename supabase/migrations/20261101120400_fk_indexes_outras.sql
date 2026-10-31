-- Step 16: FK indexes em movimentacoes, boletos e clientes
-- Verificado via pg_indexes: todos os índices de FK já existem nestas tabelas.
-- movimentacoes: empresa_id ✓ | boletos: empresa_id ✓, conta_bancaria_id ✓ | clientes: empresa_id ✓
-- Idempotente via IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_id ON movimentacoes (empresa_id);
CREATE INDEX IF NOT EXISTS idx_boletos_empresa_id ON boletos (empresa_id);
CREATE INDEX IF NOT EXISTS idx_boletos_conta_bancaria_id ON boletos (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes (empresa_id);
