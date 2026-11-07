-- Step 15: FK indexes em contas_pagar e contas_receber
-- Verificado via pg_indexes no banco bwwbeyolnnzppeuhgkcd:
--   contas_pagar já tem índice simples apenas para categoria_id (_fk) e fornecedor_id (_fk).
--   contas_receber não tem nenhum índice simples de FK.
-- Cria somente os índices ausentes (IF NOT EXISTS, idempotente).

CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_id ON contas_pagar (empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_conta_bancaria_id ON contas_pagar (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_centro_custo_id ON contas_pagar (centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_id ON contas_receber (empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente_id ON contas_receber (cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_categoria_id ON contas_receber (categoria_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_conta_bancaria_id ON contas_receber (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_centro_custo_id ON contas_receber (centro_custo_id);
