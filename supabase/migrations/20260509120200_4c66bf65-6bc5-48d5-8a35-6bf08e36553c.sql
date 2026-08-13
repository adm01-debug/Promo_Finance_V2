-- Verifica se a tabela de orçamentos já existe, se não, cria
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    category TEXT NOT NULL,
    budgeted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    period TEXT NOT NULL, -- Formato YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilita RLS na tabela de orçamentos
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para orçamentos (usando user_empresas como verificado no banco)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can view their company budgets') THEN
        CREATE POLICY "Users can view their company budgets" 
        ON public.budgets FOR SELECT 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can insert company budgets') THEN
        CREATE POLICY "Users can insert company budgets" 
        ON public.budgets FOR INSERT 
        WITH CHECK (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can update company budgets') THEN
        CREATE POLICY "Users can update company budgets" 
        ON public.budgets FOR UPDATE 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can delete company budgets') THEN
        CREATE POLICY "Users can delete company budgets" 
        ON public.budgets FOR DELETE 
        USING (company_id IN (SELECT empresa_id FROM public.user_empresas WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_budgets_updated_at') THEN
        CREATE TRIGGER update_budgets_updated_at
        BEFORE UPDATE ON public.budgets
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
