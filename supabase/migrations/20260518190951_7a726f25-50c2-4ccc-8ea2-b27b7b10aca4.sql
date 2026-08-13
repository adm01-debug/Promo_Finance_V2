-- 1. Create alertas_tributarios and darfs
CREATE TABLE IF NOT EXISTS public.alertas_tributarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    titulo TEXT NOT NULL,
    descricao TEXT,
    valor NUMERIC(15,2),
    data_vencimento DATE,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.darfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alerta_id UUID REFERENCES public.alertas_tributarios(id),
    periodo_apuracao DATE,
    valor_principal NUMERIC(15,2),
    valor_total NUMERIC(15,2),
    codigo_receita TEXT,
    data_vencimento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Expand acoes_recomendadas
ALTER TABLE public.acoes_recomendadas ADD COLUMN IF NOT EXISTS urgencia TEXT;
ALTER TABLE public.acoes_recomendadas ADD COLUMN IF NOT EXISTS impacto_estimado NUMERIC(15,2);
ALTER TABLE public.acoes_recomendadas ADD COLUMN IF NOT EXISTS impacto_tipo TEXT;
ALTER TABLE public.acoes_recomendadas ADD COLUMN IF NOT EXISTS link_resolucao TEXT;

-- 3. Update acordos_parcelamento
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS valor_original NUMERIC(15,2);
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS valor_total_acordo NUMERIC(15,2);
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE public.acordos_parcelamento ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;

-- 4. Security tables
CREATE TABLE IF NOT EXISTS public.dispositivos_conhecidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    device_name TEXT,
    browser TEXT,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_trusted BOOLEAN DEFAULT false
);

ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS acao_url TEXT;

-- 5. RLS
ALTER TABLE public.alertas_tributarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.darfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos_conhecidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tax alerts" ON public.alertas_tributarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their own darfs" ON public.darfs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage their own devices" ON public.dispositivos_conhecidos FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.alertas_tributarios TO authenticated;
GRANT ALL ON public.darfs TO authenticated;
GRANT ALL ON public.dispositivos_conhecidos TO authenticated;
