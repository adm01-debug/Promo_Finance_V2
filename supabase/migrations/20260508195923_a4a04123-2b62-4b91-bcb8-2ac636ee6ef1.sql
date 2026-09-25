-- Prevent duplicate freight/supplier payments in contas_pagar
-- We use a partial index to allow same data if one is cancelled
CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_prevent_duplicates 
ON public.contas_pagar (fornecedor_id, valor, data_vencimento, numero_documento) 
WHERE (status != 'cancelado' AND fornecedor_id IS NOT NULL AND numero_documento IS NOT NULL);

-- Also add one for cases where supplier is identified by name only (legacy/import)
-- fornecedor_nome só é criada pela migration 20260518190420 (timestamp mais
-- recente que este arquivo) -- em replay do zero (Supabase Preview) essa
-- coluna ainda não existe aqui. Em produção a coluna já existe há muito
-- tempo, então o IF EXISTS abaixo é sempre verdadeiro e roda igual.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='fornecedor_nome') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_pagar_name_prevent_duplicates
        ON public.contas_pagar (fornecedor_nome, valor, data_vencimento, numero_documento)
        WHERE (status != 'cancelado' AND fornecedor_id IS NULL AND numero_documento IS NOT NULL);
    END IF;
END $$;

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
