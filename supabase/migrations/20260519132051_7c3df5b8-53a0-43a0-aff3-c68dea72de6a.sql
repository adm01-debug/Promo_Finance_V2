-- 1. Full Lucro Real calculation support
ALTER TABLE public.apuracoes_irpj_csll 
ADD COLUMN IF NOT EXISTS lucro_real_antes_compensacao NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS compensacao_prejuizos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS lucro_real NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS irpj_aliquota_normal NUMERIC DEFAULT 15,
ADD COLUMN IF NOT EXISTS irpj_aliquota_adicional NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS csll_aliquota NUMERIC DEFAULT 9,
ADD COLUMN IF NOT EXISTS pat_deducao NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS outros_incentivos NUMERIC DEFAULT 0;

-- 2. Prejuizo status and availability
ALTER TABLE public.prejuizos_fiscais 
ADD COLUMN IF NOT EXISTS saldo_disponivel NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disponivel';

-- 3. missing columns for IRPJ hook
ALTER TABLE public.apuracoes_irpj_csll 
ADD COLUMN IF NOT EXISTS estimativas_pagas NUMERIC DEFAULT 0;

-- 4. Audit columns
ALTER TABLE public.apuracoes_irpj_csll ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.prejuizos_fiscais ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
