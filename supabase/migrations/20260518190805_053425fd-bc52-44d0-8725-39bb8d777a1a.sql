-- 1. Create transferencias table
CREATE TABLE IF NOT EXISTS public.transferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    user_id UUID REFERENCES auth.users(id),
    conta_origem_id UUID REFERENCES public.contas_bancarias(id),
    conta_destino_id UUID REFERENCES public.contas_bancarias(id),
    valor NUMERIC(15,2) NOT NULL,
    descricao TEXT,
    data_transferencia DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'concluido',
    chave_pix TEXT,
    pix_chave_destino TEXT,
    favorecido_nome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create bitrix_webhook_events table
CREATE TABLE IF NOT EXISTS public.bitrix_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB,
    processed BOOLEAN DEFAULT false,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create regimes_tributarios table (for Reforma Tributaria)
CREATE TABLE IF NOT EXISTS public.regimes_tributarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    regime_nome TEXT NOT NULL,
    reducao_cbs NUMERIC(5,2),
    reducao_ibs NUMERIC(5,2),
    data_inicio DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create allowed_countries table (for Security)
CREATE TABLE IF NOT EXISTS public.allowed_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    country_name TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Update security_settings
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS allowed_global_ips JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS require_2fa BOOLEAN DEFAULT false;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS restrict_by_ip BOOLEAN DEFAULT false;
ALTER TABLE public.security_settings ADD COLUMN IF NOT EXISTS enable_geo_restriction BOOLEAN DEFAULT false;

-- 6. Enable RLS
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regimes_tributarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transferencias" ON public.transferencias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their own bitrix_events" ON public.bitrix_webhook_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their own regimes" ON public.regimes_tributarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage allowed_countries" ON public.allowed_countries FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.transferencias TO authenticated;
GRANT ALL ON public.bitrix_webhook_events TO authenticated;
GRANT ALL ON public.regimes_tributarios TO authenticated;
GRANT ALL ON public.allowed_countries TO authenticated;
