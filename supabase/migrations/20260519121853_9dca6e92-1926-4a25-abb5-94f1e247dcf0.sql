-- Fix budgets table to match frontend expectations
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'company_id') THEN
        ALTER TABLE public.budgets ADD COLUMN company_id UUID REFERENCES public.empresas(id);
        -- Copy data from empresa_id if it exists
        UPDATE public.budgets SET company_id = empresa_id WHERE company_id IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'user_id') THEN
        ALTER TABLE public.budgets ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'category') THEN
        ALTER TABLE public.budgets ADD COLUMN category TEXT;
        -- Default to 'Geral' or use 'nome'
        UPDATE public.budgets SET category = nome WHERE category IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'budgeted_amount') THEN
        ALTER TABLE public.budgets ADD COLUMN budgeted_amount NUMERIC(15,2) DEFAULT 0;
        -- Copy from valor_total
        UPDATE public.budgets SET budgeted_amount = valor_total WHERE budgeted_amount = 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'spent_amount') THEN
        ALTER TABLE public.budgets ADD COLUMN spent_amount NUMERIC(15,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'period') THEN
        ALTER TABLE public.budgets ADD COLUMN period TEXT;
        -- Generate from periodo_inicio (YYYY-MM)
        UPDATE public.budgets SET period = to_char(periodo_inicio, 'YYYY-MM') WHERE period IS NULL AND periodo_inicio IS NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'updated_at') THEN
        ALTER TABLE public.budgets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;
