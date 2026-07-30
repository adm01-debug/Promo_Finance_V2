-- 1. Security & RPC Parameter Alignment (Fixing name changes)
DROP FUNCTION IF EXISTS public.is_ip_allowed_for_login(INET);
CREATE OR REPLACE FUNCTION public.is_ip_allowed_for_login(_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.allowed_ips WHERE ip_address = _ip AND is_active = true);
END;
$$;

DROP FUNCTION IF EXISTS public.is_country_allowed_for_login(TEXT);
CREATE OR REPLACE FUNCTION public.is_country_allowed_for_login(_country TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.allowed_countries WHERE country_code = _country AND is_active = true);
END;
$$;

-- 2. Infrastructure Table Expansion
ALTER TABLE public.historico_conciliacao_ia 
ADD COLUMN IF NOT EXISTS acao TEXT,
ADD COLUMN IF NOT EXISTS tipo_lancamento TEXT,
ADD COLUMN IF NOT EXISTS score_ia NUMERIC,
ADD COLUMN IF NOT EXISTS confianca NUMERIC;

ALTER TABLE public.contas_bancarias 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.login_attempts 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- 3. New Tables
CREATE TABLE IF NOT EXISTS public.bitrix_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    entidade_tipo TEXT,
    entidade_id TEXT,
    status TEXT,
    detalhes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.bitrix_sync_logs ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own sync logs') THEN
        CREATE POLICY "Users see own sync logs" ON public.bitrix_sync_logs FOR SELECT TO authenticated USING (empresa_id IN (SELECT id FROM public.empresas));
    END IF;
END $$;
