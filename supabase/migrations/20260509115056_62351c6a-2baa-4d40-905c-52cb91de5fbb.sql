-- Adicionar coluna empresa_id se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'regras_conciliacao' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.regras_conciliacao ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Atualizar políticas de acesso (dropar as antigas se houver erro e recriar)
DROP POLICY IF EXISTS "Users can view their company's rules" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can insert rules for their company" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can update rules for their company" ON public.regras_conciliacao;
DROP POLICY IF EXISTS "Users can delete rules for their company" ON public.regras_conciliacao;

CREATE POLICY "Users can view their company's rules"
ON public.regras_conciliacao
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can insert rules for their company"
ON public.regras_conciliacao
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can update rules for their company"
ON public.regras_conciliacao
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));

CREATE POLICY "Users can delete rules for their company"
ON public.regras_conciliacao
FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_empresas.empresa_id = regras_conciliacao.empresa_id 
    AND user_empresas.user_id = auth.uid()
));