-- Drop dependent policies first
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users see own budgets" ON public.budgets;

-- Consolidate budgets table
DO $$ 
BEGIN
    -- Migrate data to company_id if company_id is null and empresa_id exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'empresa_id') THEN
        UPDATE public.budgets SET company_id = empresa_id WHERE company_id IS NULL;
        ALTER TABLE public.budgets DROP COLUMN empresa_id;
    END IF;

    -- Migrate data to category if category is null and nome exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'nome') THEN
        UPDATE public.budgets SET category = nome WHERE category IS NULL;
        ALTER TABLE public.budgets DROP COLUMN nome;
    END IF;

    -- Migrate data to budgeted_amount if budgeted_amount is 0/null and valor_total exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'valor_total') THEN
        UPDATE public.budgets SET budgeted_amount = valor_total WHERE (budgeted_amount = 0 OR budgeted_amount IS NULL);
        ALTER TABLE public.budgets DROP COLUMN valor_total;
    END IF;

    -- Migrate data to period if period is null and periodo_inicio exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'periodo_inicio') THEN
        UPDATE public.budgets SET period = TO_CHAR(periodo_inicio, 'YYYY-MM') WHERE period IS NULL;
        ALTER TABLE public.budgets DROP COLUMN periodo_inicio;
    END IF;

    -- Drop other redundant columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'periodo_fim') THEN
        ALTER TABLE public.budgets DROP COLUMN periodo_fim;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'status') THEN
        ALTER TABLE public.budgets DROP COLUMN status;
    END IF;
END $$;

-- Re-create clean policies using the consolidated columns
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" ON public.budgets
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.empresa_id = budgets.company_id
        )
    );

CREATE POLICY "Users can manage their own budgets" ON public.budgets
    FOR ALL USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.empresa_id = budgets.company_id
        )
    );