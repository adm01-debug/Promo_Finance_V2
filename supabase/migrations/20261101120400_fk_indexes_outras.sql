-- Step 16: FK indexes em movimentacoes, boletos e clientes
-- Verificado via pg_indexes no banco bwwbeyolnnzppeuhgkcd:
--   movimentacoes/boletos/clientes não têm índices simples para as FKs abaixo.
-- Cria somente os índices ausentes (IF NOT EXISTS, idempotente).

CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_id ON movimentacoes (empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_conta_bancaria_id ON movimentacoes (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_boletos_empresa_id ON boletos (empresa_id);
CREATE INDEX IF NOT EXISTS idx_boletos_conta_bancaria_id ON boletos (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_boletos_conta_pagar_id ON boletos (conta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes (empresa_id);
