-- Prevent duplicate freight/supplier payments in contas_pagar
-- We use a partial index to allow same data if one is cancelled
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_prevent_duplicates 
ON public.contas_pagar (fornecedor_id, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND fornecedor_id IS NOT NULL AND numero_documento IS NOT NULL);

-- Also add one for cases where supplier is identified by name only (legacy/import)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_name_prevent_duplicates 
ON public.contas_pagar (fornecedor_nome, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND fornecedor_id IS NULL AND numero_documento IS NOT NULL);

-- Prevent duplicate billing in contas_receber
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_receber_prevent_duplicates 
ON public.contas_receber (cliente_id, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND cliente_id IS NOT NULL AND numero_documento IS NOT NULL);

-- Add a column to track 'frete' (freight) explicitly if not exists to allow specific filtering
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='is_frete') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN is_frete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Index for freight searching
CREATE INDEX IF NOT EXISTS idx_contas_pagar_frete ON public.contas_pagar(is_frete) WHERE is_frete = true;
