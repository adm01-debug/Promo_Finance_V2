-- Item 22: índices B-tree em FKs e colunas de filtro em tabelas de alto tráfego
CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_empresa_data ON public.transacoes_bancarias (conta_bancaria_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_status ON public.transacoes_bancarias (status) WHERE status <> 'conciliado';
CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_created_at ON public.transacoes_bancarias (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_empresa_status ON public.fila_cobrancas (empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_conta_receber ON public.fila_cobrancas (conta_receber_id);
CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_status_created ON public.fila_cobrancas (status, created_at DESC) WHERE status IN ('pendente','retentando');

ANALYZE public.transacoes_bancarias;
ANALYZE public.fila_cobrancas;