-- Multas e Juros Automáticos
ALTER TABLE public.asaas_config 
ADD COLUMN IF NOT EXISTS default_fine_percent NUMERIC DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS default_interest_percent NUMERIC DEFAULT 1.0;

-- Agendamento de Cashout
CREATE TABLE IF NOT EXISTS public.asaas_scheduled_transfers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id),
    valor NUMERIC NOT NULL,
    chave_pix TEXT NOT NULL,
    tipo_chave TEXT NOT NULL,
    descricao TEXT,
    agendado_para TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_scheduled_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their scheduled transfers" 
ON public.asaas_scheduled_transfers FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Log de Risco de Crédito (IA)
CREATE TABLE IF NOT EXISTS public.asaas_credit_risk_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    score_risco INTEGER, -- 0-1000
    faixa_risco TEXT, -- BAIXO, MEDIO, ALTO
    recomendacao TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_credit_risk_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credit risk analysis" 
ON public.asaas_credit_risk_analysis FOR SELECT 
USING (true); -- Ajustar conforme necessário para segurança real
