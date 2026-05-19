-- 1. Fix health_scores_operacionais (handling default)
ALTER TABLE public.health_scores_operacionais ALTER COLUMN recomendacoes DROP DEFAULT;
ALTER TABLE public.health_scores_operacionais ALTER COLUMN recomendacoes TYPE JSONB USING to_jsonb(recomendacoes);
ALTER TABLE public.health_scores_operacionais ALTER COLUMN recomendacoes SET DEFAULT '[]';

-- 2. IA History Adjustments
ALTER TABLE public.historico_conciliacao_ia DROP COLUMN IF EXISTS motivos;
ALTER TABLE public.historico_conciliacao_ia ADD COLUMN motivos JSONB DEFAULT '[]';

-- 3. Financial Detail Columns
ALTER TABLE public.faturamento_mensal 
ADD COLUMN IF NOT EXISTS receita_revenda NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS receita_industria NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS receita_exportacao NUMERIC DEFAULT 0;

ALTER TABLE public.folha_pagamento 
ADD COLUMN IF NOT EXISTS total_folha NUMERIC DEFAULT 0;

-- 4. Additional Audit and Metadata
ALTER TABLE public.apuracoes_irpj_csll 
ADD COLUMN IF NOT EXISTS tipo_apuracao TEXT,
ADD COLUMN IF NOT EXISTS ano INTEGER,
ADD COLUMN IF NOT EXISTS lucro_contabil NUMERIC DEFAULT 0;
