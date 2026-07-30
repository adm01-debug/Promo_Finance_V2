-- Align Expert System with Frontend Types
ALTER TABLE public.expert_conversations RENAME COLUMN title TO titulo;
ALTER TABLE public.expert_conversations RENAME COLUMN context_summary TO resumo;

ALTER TABLE public.expert_messages DROP COLUMN actions_executed;
ALTER TABLE public.expert_messages ADD COLUMN actions_executed BOOLEAN DEFAULT false;

-- Missing Tables for Filters and Routing
CREATE TABLE IF NOT EXISTS public.user_filter_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    screen_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regras_roteamento_financeiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    nome TEXT NOT NULL,
    condicoes JSONB DEFAULT '[]',
    prioridade INTEGER DEFAULT 0,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.formas_pagamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT, -- 'pix', 'boleto', 'cartao', etc
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure deleted_at exists in financial tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='deleted_at') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_receber' AND column_name='deleted_at') THEN
        ALTER TABLE public.contas_receber ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Duplicate Rules
CREATE TABLE IF NOT EXISTS public.regras_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    campos_validacao TEXT[] NOT NULL,
    tempo_bloqueio_minutos INTEGER DEFAULT 60,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update RPC generate_reconciliation_suggestions
CREATE OR REPLACE FUNCTION public.generate_reconciliation_suggestions(
    p_empresa_id UUID,
    p_transaction_date DATE,
    p_transaction_value NUMERIC,
    p_transaction_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Basic stub for suggestions
    RETURN jsonb_build_array();
END;
$$;

-- RLS for new tables
ALTER TABLE public.user_filter_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_roteamento_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their presets" ON public.user_filter_presets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Empresa access for routing" ON public.regras_roteamento_financeiro FOR ALL USING (true); -- Simplified
CREATE POLICY "Empresa access for payment methods" ON public.formas_pagamento FOR ALL USING (true);
CREATE POLICY "Empresa access for duplicate rules" ON public.regras_duplicidade FOR ALL USING (true);
