-- 1. EXPAND APURACOES_TRIBUTARIAS
ALTER TABLE public.apuracoes_tributarias 
ADD COLUMN IF NOT EXISTS ano INTEGER,
ADD COLUMN IF NOT EXISTS mes INTEGER,
ADD COLUMN IF NOT EXISTS cbs_debitos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cbs_creditos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cbs_a_pagar NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cbs_a_compensar NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ibs_debitos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ibs_creditos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ibs_a_pagar NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS ibs_a_compensar NUMERIC DEFAULT 0;

-- 2. EXPAND CONFIGURACOES_APROVACAO
ALTER TABLE public.configuracoes_aprovacao 
ADD COLUMN IF NOT EXISTS valor_minimo_aprovacao NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS aprovadores_obrigatorios INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. EXPAND FLUXOS_APROVACAO_NIVEIS
ALTER TABLE public.fluxos_aprovacao_niveis 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id),
ADD COLUMN IF NOT EXISTS ordem INTEGER,
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 4. CREATE OPERACOES_TRIBUTAVEIS
CREATE TABLE IF NOT EXISTS public.operacoes_tributaveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    data_operacao DATE,
    valor_total NUMERIC,
    cbs_aliquota NUMERIC,
    cbs_valor NUMERIC,
    ibs_aliquota NUMERIC,
    ibs_valor NUMERIC,
    tipo_operacao TEXT, -- 'compra', 'venda'
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS FOR NEW TABLE
ALTER TABLE public.operacoes_tributaveis ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own operacoes') THEN
        CREATE POLICY "Users view own operacoes" ON public.operacoes_tributaveis FOR SELECT TO authenticated USING (empresa_id IN (SELECT id FROM public.empresas));
    END IF;
END $$;
