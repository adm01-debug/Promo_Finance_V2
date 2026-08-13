-- 1. Detailed IRPJ/CSLL columns
ALTER TABLE public.apuracoes_irpj_csll 
ADD COLUMN IF NOT EXISTS adicoes_permanentes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS adicoes_temporarias NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_adicoes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS exclusoes_permanentes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS exclusoes_temporarias NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_exclusoes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS irrf_retido NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS csrf_retido NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_negativo_anterior NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS compensacao_prejuizo NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_calculo_irpj NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_calculo_csll NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS adicional_irpj NUMERIC DEFAULT 0;

-- 2. Detailed Prejuízo columns
ALTER TABLE public.prejuizos_fiscais 
ADD COLUMN IF NOT EXISTS tipo TEXT, -- 'irpj' ou 'csll'
ADD COLUMN IF NOT EXISTS ano_origem INTEGER,
ADD COLUMN IF NOT EXISTS valor_original NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_compensado NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_atual NUMERIC DEFAULT 0;

-- 3. Audit for history
ALTER TABLE public.faturamento_mensal ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.folha_pagamento ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
