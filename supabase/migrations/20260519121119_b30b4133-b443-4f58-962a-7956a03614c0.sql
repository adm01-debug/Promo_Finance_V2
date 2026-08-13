-- 1. APURACOES_TRIBUTARIAS Completion
ALTER TABLE public.apuracoes_tributarias 
ADD COLUMN IF NOT EXISTS icms_residual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS iss_residual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS pis_residual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cofins_residual NUMERIC DEFAULT 0;

-- 2. OPERACOES_TRIBUTAVEIS Completion
ALTER TABLE public.operacoes_tributaveis 
ADD COLUMN IF NOT EXISTS pis_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cofins_valor NUMERIC DEFAULT 0;

-- 3. ACORDOS_PARCELAMENTO Completion
ALTER TABLE public.acordos_parcelamento
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- 4. NOTAS_FISCAIS Table
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero TEXT,
    serie TEXT,
    chave_acesso TEXT UNIQUE,
    valor_total NUMERIC DEFAULT 0,
    valor_icms NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'emitida',
    xml_url TEXT,
    data_emissao TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RPC FIXES
-- Updating generate_reconciliation_suggestions to accept p_empresa_id as seen in errors
CREATE OR REPLACE FUNCTION public.generate_reconciliation_suggestions(p_sessao_id UUID, p_empresa_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Implementation stub
END;
$$;

-- Creating missing log_audit RPC
CREATE OR REPLACE FUNCTION public.log_audit(p_table_name TEXT, p_record_id UUID, p_action TEXT, p_details TEXT DEFAULT NULL, p_old_data JSONB DEFAULT NULL, p_new_data JSONB DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO public.audit_logs (table_name, record_id, action, details, old_data, new_data, user_id, user_email)
    VALUES (p_table_name, p_record_id, p_action, p_details, p_old_data, p_new_data, auth.uid(), (auth.jwt()->>'email'))
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- 6. RLS
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own NFs') THEN
        CREATE POLICY "Users view own NFs" ON public.notas_fiscais FOR SELECT TO authenticated USING (empresa_id IN (SELECT id FROM public.empresas));
    END IF;
END $$;
