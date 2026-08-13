-- 1. Tributário module
CREATE TABLE IF NOT EXISTS public.apuracoes_irpj_csll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    lucro_antes_impostos NUMERIC DEFAULT 0,
    irpj_valor NUMERIC DEFAULT 0,
    csll_valor NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'rascunho',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prejuizos_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    periodo DATE NOT NULL,
    valor_acumulado NUMERIC DEFAULT 0,
    valor_utilizado NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Health Score enrichment
ALTER TABLE public.health_scores_operacionais 
ADD COLUMN IF NOT EXISTS score_lgpd NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS score_cadastros NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS score_engajamento NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS tendencia_pct NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS insights_md TEXT;

-- 3. Financial History enrichment
ALTER TABLE public.faturamento_mensal 
ADD COLUMN IF NOT EXISTS ano INTEGER,
ADD COLUMN IF NOT EXISTS mes INTEGER,
ADD COLUMN IF NOT EXISTS receita_bruta NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS receita_servicos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS receita_vendas NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS impostos_federais NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS impostos_municipais NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

ALTER TABLE public.folha_pagamento 
ADD COLUMN IF NOT EXISTS ano INTEGER,
ADD COLUMN IF NOT EXISTS mes INTEGER,
ADD COLUMN IF NOT EXISTS salarios NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pro_labore NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS encargos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS beneficios NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 4. Audit columns in IA History
ALTER TABLE public.historico_conciliacao_ia ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- RLS
ALTER TABLE public.apuracoes_irpj_csll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prejuizos_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa access for apuracoes" ON public.apuracoes_irpj_csll FOR ALL USING (true);
CREATE POLICY "Empresa access for prejuizos" ON public.prejuizos_fiscais FOR ALL USING (true);
