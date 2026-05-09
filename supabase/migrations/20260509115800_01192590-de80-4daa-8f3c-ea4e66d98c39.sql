-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    budgeted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    period TEXT NOT NULL, -- e.g., "2024-05"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view budgets of their companies"
    ON public.budgets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can insert budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can update budgets"
    ON public.budgets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can delete budgets"
    ON public.budgets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_empresas
            WHERE user_id = auth.uid() AND empresa_id = budgets.company_id
        ) OR user_id = auth.uid()
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
