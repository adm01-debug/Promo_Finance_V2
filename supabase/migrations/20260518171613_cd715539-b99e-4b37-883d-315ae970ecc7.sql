-- 1. regua_cobranca
ALTER TABLE public.regua_cobranca 
ADD COLUMN IF NOT EXISTS dias_gatilho INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS canais TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS auto_executar BOOLEAN DEFAULT false;

-- 2. templates_cobranca
ALTER TABLE public.templates_cobranca 
ADD COLUMN IF NOT EXISTS etapa TEXT,
ADD COLUMN IF NOT EXISTS padrao BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tom TEXT,
ADD COLUMN IF NOT EXISTS variaveis_disponiveis TEXT[] DEFAULT '{}';

-- 3. audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. frontend_error_logs
CREATE TABLE IF NOT EXISTS public.frontend_error_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    stack TEXT,
    component_name TEXT,
    url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Enable RLS and Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frontend_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs 
    FOR SELECT TO authenticated 
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own error logs" ON public.frontend_error_logs 
    FOR INSERT TO authenticated 
    WITH CHECK (true);

-- 6. Fix for asaas_reconciliation_suggestions view/relation issue
-- Ensure the table exists with correct columns to avoid SelectQueryError
ALTER TABLE public.asaas_reconciliation_suggestions 
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS valor NUMERIC,
ADD COLUMN IF NOT EXISTS data_vencimento DATE;
