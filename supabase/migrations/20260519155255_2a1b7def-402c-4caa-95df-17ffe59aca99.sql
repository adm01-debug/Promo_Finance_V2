-- Open Finance Consents
CREATE TABLE IF NOT EXISTS public.open_finance_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    institution_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    permissions TEXT[],
    authorization_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.open_finance_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own consents"
    ON public.open_finance_consents
    FOR ALL
    USING (auth.uid() = user_id);

-- Metas Financeiras
CREATE TABLE IF NOT EXISTS public.metas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    valor_meta DECIMAL(12,2) NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metas"
    ON public.metas_financeiras
    FOR SELECT
    USING (true); -- Simplificando por enquanto, ou use auth.uid() se houver coluna user_id

-- Historico Score Saude
CREATE TABLE IF NOT EXISTS public.historico_score_saude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    score INTEGER NOT NULL,
    data_calculo TIMESTAMP WITH TIME ZONE DEFAULT now(),
    detalhes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.historico_score_saude ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view score history"
    ON public.historico_score_saude
    FOR SELECT
    USING (true);

-- Recomendacoes IA
CREATE TABLE IF NOT EXISTS public.recomendacoes_metas_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    impacto_estimado DECIMAL(12,2),
    aplicada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.recomendacoes_metas_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view recommendations"
    ON public.recomendacoes_metas_ia
    FOR SELECT
    USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_open_finance') THEN
        CREATE TRIGGER set_updated_at_open_finance BEFORE UPDATE ON public.open_finance_consents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_metas') THEN
        CREATE TRIGGER set_updated_at_metas BEFORE UPDATE ON public.metas_financeiras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
