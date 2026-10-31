-- Step 24: índice composto para performance da RPC obter_totais_movimentacoes
-- com >5000 lançamentos: filtragem por empresa_id + data_movimentacao sem deleted
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_data
  ON public.movimentacoes (empresa_id, data_movimentacao)
  WHERE deleted_at IS NULL;
