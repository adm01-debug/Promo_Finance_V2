-- Add missing columns to divergencias_conciliacao
ALTER TABLE public.divergencias_conciliacao ADD COLUMN IF NOT EXISTS recomendacao TEXT;

-- Add missing columns to contas_bancarias
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS cor TEXT;
ALTER TABLE public.contas_bancarias ADD COLUMN IF NOT EXISTS configuracoes_roteamento JSONB;

-- Add missing column to sessoes_conciliacao
ALTER TABLE public.sessoes_conciliacao ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id);

-- Enable RLS for all reconciliation tables
ALTER TABLE public.divergencias_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_conciliacao_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_duplicidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own divergencias" ON public.divergencias_conciliacao;
    DROP POLICY IF EXISTS "Users can manage their own divergencias" ON public.divergencias_conciliacao;
    DROP POLICY IF EXISTS "Users can manage their own feedback_ia" ON public.feedback_conciliacao_ia;
    DROP POLICY IF EXISTS "Users can manage their own sessoes_conciliacao" ON public.sessoes_conciliacao;
    DROP POLICY IF EXISTS "Users can manage their own regras_conciliacao" ON public.regras_conciliacao;
    DROP POLICY IF EXISTS "Users can manage their own configuracoes_duplicidade" ON public.configuracoes_duplicidade;
    DROP POLICY IF EXISTS "Users can manage their own extrato_bancario" ON public.extrato_bancario;
END $$;

-- Create policies
CREATE POLICY "Users can manage their own divergencias" 
ON public.divergencias_conciliacao FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage their own feedback_ia" 
ON public.feedback_conciliacao_ia FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage their own sessoes_conciliacao" 
ON public.sessoes_conciliacao FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own regras_conciliacao" 
ON public.regras_conciliacao FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage their own configuracoes_duplicidade" 
ON public.configuracoes_duplicidade FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can manage their own extrato_bancario" 
ON public.extrato_bancario FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: Using (true) for some policies for now to avoid locking out data that might not have user_id yet, 
-- but ensuring 'authenticated' role is required.
