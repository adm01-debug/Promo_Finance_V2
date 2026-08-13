-- Dashboard Histórico Tables
CREATE TABLE IF NOT EXISTS public.faturamento_mensal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    mes_referencia DATE NOT NULL,
    valor_faturamento NUMERIC DEFAULT 0,
    valor_impostos NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.folha_pagamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    mes_referencia DATE NOT NULL,
    valor_total NUMERIC DEFAULT 0,
    qtd_funcionarios INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Health Score update
ALTER TABLE public.health_scores_operacionais 
ADD COLUMN IF NOT EXISTS snapshot_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS score_total NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS score_tributario NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS score_financeiro NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS score_operacional NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS recomendacoes TEXT[] DEFAULT '{}';

-- IA History updates
ALTER TABLE public.historico_conciliacao_ia ALTER COLUMN confianca TYPE TEXT;

ALTER TABLE public.feedback_conciliacao_ia 
ADD COLUMN IF NOT EXISTS transacao_descricao TEXT,
ADD COLUMN IF NOT EXISTS lancamento_entidade TEXT,
ADD COLUMN IF NOT EXISTS lancamento_descricao TEXT,
ADD COLUMN IF NOT EXISTS tipo_lancamento TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Ensure RLS for new tables
ALTER TABLE public.faturamento_mensal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa access for faturamento" ON public.faturamento_mensal FOR ALL USING (true);
CREATE POLICY "Empresa access for folha" ON public.folha_pagamento FOR ALL USING (true);
