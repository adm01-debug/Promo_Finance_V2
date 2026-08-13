-- 1. STUB RPCs referenced in hooks
CREATE OR REPLACE FUNCTION public.registrar_evento_pagar(p_conta_id UUID, p_evento TEXT, p_detalhes JSONB DEFAULT '{}'::jsonb)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_id UUID;
BEGIN
    RETURN gen_random_uuid();
END;
$$;

-- 2. TABLE Expansion: boletos
ALTER TABLE public.boletos 
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS sacado_nome TEXT,
ADD COLUMN IF NOT EXISTS sacado_cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS cedente_nome TEXT,
ADD COLUMN IF NOT EXISTS banco_nome TEXT,
ADD COLUMN IF NOT EXISTS data_emissao DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC,
ADD COLUMN IF NOT EXISTS juros_multa NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS rastreio_status TEXT,
ADD COLUMN IF NOT EXISTS eventos_pagamento JSONB DEFAULT '[]'::jsonb;

-- 3. TABLE Expansion: historico_conciliacao_ia
ALTER TABLE public.historico_conciliacao_ia 
ADD COLUMN IF NOT EXISTS analise_ia TEXT,
ADD COLUMN IF NOT EXISTS transacao_bancaria_id UUID,
ADD COLUMN IF NOT EXISTS conta_pagar_id UUID,
ADD COLUMN IF NOT EXISTS motivos TEXT[];

-- 4. TABLE Expansion: bitrix_sync_logs
ALTER TABLE public.bitrix_sync_logs 
ADD COLUMN IF NOT EXISTS tipo TEXT,
ADD COLUMN IF NOT EXISTS entidade TEXT,
ADD COLUMN IF NOT EXISTS registros_processados INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS registros_com_erro INTEGER DEFAULT 0;

-- 5. NEW TABLES: bitrix_field_mappings & budgets
CREATE TABLE IF NOT EXISTS public.bitrix_field_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    bitrix_field_name TEXT NOT NULL,
    internal_field_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    nome TEXT NOT NULL,
    valor_total NUMERIC NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. RLS
ALTER TABLE public.bitrix_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own mappings" ON public.bitrix_field_mappings FOR SELECT TO authenticated USING (empresa_id IN (SELECT id FROM public.empresas));
CREATE POLICY "Users see own budgets" ON public.budgets FOR SELECT TO authenticated USING (empresa_id IN (SELECT id FROM public.empresas));
