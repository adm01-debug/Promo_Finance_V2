-- Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operacional';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'visualizador';

-- Update has_role to use the profiles table (matching Finance Hub logic)
-- Using existing parameter names to avoid replacement issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = _user_id
          AND role = _role::text
    )
$function$;

-- Create missing tables for anomalies and finance
CREATE TABLE IF NOT EXISTS public.anomalias_detectadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID,
    entidade_tipo TEXT,
    entidade_id UUID,
    tipo_anomalia TEXT,
    tipo TEXT NOT NULL,
    descricao TEXT,
    prioridade TEXT DEFAULT 'media',
    status TEXT DEFAULT 'pendente',
    severidade TEXT DEFAULT 'media',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    resumo_executivo TEXT,
    alertas_gerados INTEGER DEFAULT 0,
    score_saude_financeira NUMERIC
);

CREATE TABLE IF NOT EXISTS public.anomalia_toast_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anomalia_id UUID REFERENCES public.anomalias_detectadas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    dispatched_at TIMESTAMPTZ DEFAULT NOW(),
    severidade TEXT,
    tipo_anomalia TEXT,
    mensagem TEXT,
    status TEXT DEFAULT 'sent'
);

CREATE TABLE IF NOT EXISTS public.centros_custo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    codigo TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    empresa_id UUID,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure profiles has necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
-- Role is already there but let's make sure it's TEXT to be flexible
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'visualizador';

-- RPCs for automation
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS JSONB AS $$
BEGIN
    RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_cron_run_history()
RETURNS JSONB AS $$
BEGIN
    RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
ALTER TABLE public.anomalias_detectadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalia_toast_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select" ON public.anomalias_detectadas;
CREATE POLICY "Public Select" ON public.anomalias_detectadas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Select" ON public.anomalia_toast_eventos;
CREATE POLICY "Public Select" ON public.anomalia_toast_eventos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public Select" ON public.centros_custo;
CREATE POLICY "Public Select" ON public.centros_custo FOR SELECT USING (true);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.anomalias_detectadas TO authenticated;
GRANT ALL ON public.anomalia_toast_eventos TO authenticated;
GRANT ALL ON public.centros_custo TO authenticated;
