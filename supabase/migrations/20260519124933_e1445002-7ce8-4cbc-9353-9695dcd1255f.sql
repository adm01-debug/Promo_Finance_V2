-- 1. Final Budgets Consolidation
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'empresa_id') THEN
        UPDATE public.budgets SET company_id = empresa_id WHERE company_id IS NULL;
        ALTER TABLE public.budgets DROP COLUMN empresa_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'nome') THEN
        UPDATE public.budgets SET category = nome WHERE category IS NULL;
        ALTER TABLE public.budgets DROP COLUMN nome;
    END IF;
END $$;

-- 2. Compliance and Verification Enhancements
ALTER TABLE public.verificacoes_conformidade 
ADD COLUMN IF NOT EXISTS periodo TEXT,
ADD COLUMN IF NOT EXISTS nivel TEXT,
ADD COLUMN IF NOT EXISTS total_checks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS checks_aprovados INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS itens JSONB DEFAULT '[]'::jsonb;

-- 3. Approval Flow Metadata
ALTER TABLE public.solicitacoes_aprovacao 
ADD COLUMN IF NOT EXISTS solicitado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP WITH TIME ZONE;

-- 4. Custom Fields Infrastructure
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',
    placeholder TEXT,
    options JSONB,
    required BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id UUID REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(definition_id, entity_id)
);

-- Ensure RLS for new custom fields
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage custom field definitions" ON public.custom_field_definitions;
CREATE POLICY "Users can manage custom field definitions" ON public.custom_field_definitions
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.empresa_id = custom_field_definitions.empresa_id));

DROP POLICY IF EXISTS "Users can manage custom field values" ON public.custom_field_values;
CREATE POLICY "Users can manage custom field values" ON public.custom_field_values
FOR ALL USING (EXISTS (SELECT 1 FROM profiles p JOIN custom_field_definitions d ON d.empresa_id = p.empresa_id WHERE p.id = auth.uid() AND custom_field_values.definition_id = d.id));