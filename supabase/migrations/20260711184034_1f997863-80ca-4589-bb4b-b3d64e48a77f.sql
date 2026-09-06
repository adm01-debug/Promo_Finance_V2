-- Item 22: índices B-tree em FKs e colunas de filtro em tabelas de alto tráfego
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transacoes_bancarias') THEN
    CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_empresa_data ON public.transacoes_bancarias (conta_bancaria_id, data DESC);
    CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_status ON public.transacoes_bancarias (status) WHERE status <> 'conciliado';
    CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_created_at ON public.transacoes_bancarias (created_at DESC);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fila_cobrancas') THEN
    CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_empresa_status ON public.fila_cobrancas (empresa_id, status);
    CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_conta_receber ON public.fila_cobrancas (conta_receber_id);
    CREATE INDEX IF NOT EXISTS idx_fila_cobrancas_status_created ON public.fila_cobrancas (status, created_at DESC) WHERE status IN ('pendente','retentando');
  END IF;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['transacoes_bancarias','fila_cobrancas'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ANALYZE public.%I', t);
    END IF;
  END LOOP;
END $$;
