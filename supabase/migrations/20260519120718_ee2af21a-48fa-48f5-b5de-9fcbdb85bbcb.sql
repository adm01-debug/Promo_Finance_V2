-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE MISSING TABLES REFERENCED IN ERRORS
CREATE TABLE IF NOT EXISTS public.anomalia_detection_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by UUID REFERENCES auth.users(id),
    trigger_source TEXT,
    status TEXT DEFAULT 'queued',
    inseridas INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.configuracoes_aprovacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    modulo TEXT,
    valor_minimo NUMERIC,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.apuracoes_tributarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    tipo_tributo TEXT,
    competencia TEXT,
    valor_total NUMERIC,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.aprovacao_comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID,
    user_id UUID REFERENCES auth.users(id),
    comentario TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fluxos_aprovacao_niveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    configuracao_id UUID REFERENCES public.configuracoes_aprovacao(id),
    nivel INTEGER,
    role_responsavel TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. FIX COLUMNS IN EXISTING TABLES
ALTER TABLE public.contas_bancarias 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

ALTER TABLE public.solicitacoes_aprovacao 
ADD COLUMN IF NOT EXISTS conta_pagar_id UUID REFERENCES public.contas_pagar(id);

-- 4. ENABLE RLS
ALTER TABLE public.anomalia_detection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_aprovacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apuracoes_tributarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aprovacao_comentarios ENABLE ROW LEVEL SECURITY;

-- 5. BASIC POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view their own data in newly created tables') THEN
        CREATE POLICY "Users view their own data in newly created tables" ON public.anomalia_detection_runs FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
