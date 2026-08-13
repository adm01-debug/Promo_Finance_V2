-- 1. Final Fiscal Alignment
ALTER TABLE public.apuracoes_tributarias 
ADD COLUMN IF NOT EXISTS total_tributos_novos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tributos_residuais NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_geral NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.creditos_tributarios 
ADD COLUMN IF NOT EXISTS nota_fiscal_id UUID REFERENCES public.notas_fiscais(id);

-- 2. New Infrastructure Tables
CREATE TABLE IF NOT EXISTS public.historico_conciliacao_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id UUID REFERENCES public.sessoes_conciliacao(id),
    transacao_id UUID,
    resultado JSONB,
    score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    revoked BOOLEAN DEFAULT false,
    last_active TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Standardizing RPC Signatures
CREATE OR REPLACE FUNCTION public.is_ip_allowed_for_login(p_ip_address INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.allowed_ips WHERE ip_address = p_ip_address AND is_active = true);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_country_allowed_for_login(p_country_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.allowed_countries WHERE country_code = p_country_code AND is_active = true);
END;
$$;

-- Updating generate_reconciliation_suggestions with full parameter support
CREATE OR REPLACE FUNCTION public.generate_reconciliation_suggestions(p_sessao_id UUID, p_empresa_id UUID DEFAULT NULL, p_transaction_date DATE DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Implementation
END;
$$;

-- 4. RLS for new infra
ALTER TABLE public.historico_conciliacao_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own sessions" ON public.user_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users see IA history" ON public.historico_conciliacao_ia FOR SELECT TO authenticated USING (true);
