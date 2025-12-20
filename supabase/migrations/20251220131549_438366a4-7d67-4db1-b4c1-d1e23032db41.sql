-- Create table for financial goals
CREATE TABLE public.metas_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'inadimplencia', 'economia')),
  titulo TEXT NOT NULL,
  valor_meta NUMERIC NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tipo, mes, ano)
);

-- Enable RLS
ALTER TABLE public.metas_financeiras ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view metas_financeiras"
ON public.metas_financeiras
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Financeiro+ can manage metas_financeiras"
ON public.metas_financeiras
FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- Trigger for updated_at
CREATE TRIGGER update_metas_financeiras_updated_at
BEFORE UPDATE ON public.metas_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default goals for current month
INSERT INTO public.metas_financeiras (tipo, titulo, valor_meta, mes, ano)
VALUES 
  ('receita', 'Meta de Receitas', 150000, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
  ('despesa', 'Limite de Despesas', 100000, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
  ('inadimplencia', 'Inadimplência Máxima', 5, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);