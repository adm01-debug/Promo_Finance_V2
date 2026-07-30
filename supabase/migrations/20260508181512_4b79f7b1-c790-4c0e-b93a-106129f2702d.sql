CREATE TABLE IF NOT EXISTS public.asaas_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    asaas_id TEXT UNIQUE,
    empresa_id UUID REFERENCES public.empresas(id),
    valor NUMERIC NOT NULL,
    chave_pix TEXT NOT NULL,
    tipo_chave TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    idempotency_key TEXT UNIQUE NOT NULL,
    comprovante_url TEXT,
    transaction_receipt_url TEXT,
    last_error TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfers of their company" 
ON public.asaas_transfers FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Admins can insert transfers" 
ON public.asaas_transfers FOR INSERT 
WITH CHECK (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Admins can update transfers" 
ON public.asaas_transfers FOR UPDATE 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Index for idempotency
CREATE INDEX IF NOT EXISTS idx_asaas_transfers_idempotency ON public.asaas_transfers(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_asaas_transfers_empresa_date ON public.asaas_transfers(empresa_id, created_at);
