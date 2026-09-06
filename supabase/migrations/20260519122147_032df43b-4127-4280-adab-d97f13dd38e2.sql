-- Create missing categorias table
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    cor TEXT,
    icone TEXT,
    ativo BOOLEAN DEFAULT true,
    empresa_id UUID REFERENCES public.empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Guard: categorias já existe desde 001_create_tables.sql (sem empresa_id,
-- só user_id) — o CREATE TABLE IF NOT EXISTS acima é no-op num replay do
-- zero, e as duas CREATE POLICY abaixo referenciam empresa_id diretamente.
-- Sem esta linha, esta própria migration quebra com
-- "column empresa_id does not exist" (achado na auditoria da PR #63).
ALTER TABLE public.categorias ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);

-- Enable RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view categories of their company" ON public.categorias
    FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage categories of their company" ON public.categorias
    FOR ALL USING (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid()));

-- Add category_id to contas_pagar and contas_receber if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'categoria_id') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN categoria_id UUID REFERENCES public.categorias(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'categoria_id') THEN
        ALTER TABLE public.contas_receber ADD COLUMN categoria_id UUID REFERENCES public.categorias(id);
    END IF;
END $$;
