-- Create table for Custom Field Definitions
CREATE TABLE public.custom_field_definitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'contas_pagar', 'contas_receber', 'clientes', etc.
    name TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'date', 'select', 'boolean'
    label TEXT NOT NULL,
    placeholder TEXT,
    options JSONB, -- For 'select' type
    required BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(entity_type, name, empresa_id)
);

-- Add custom_fields column to core tables
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;

-- Enable RLS for definitions
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view definitions of their company"
ON public.custom_field_definitions
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM public.user_empresas WHERE empresa_id = public.custom_field_definitions.empresa_id
));

CREATE POLICY "Admins can manage definitions"
ON public.custom_field_definitions
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.user_empresas 
    WHERE user_id = auth.uid() 
    AND empresa_id = public.custom_field_definitions.empresa_id 
    AND role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER update_custom_field_definitions_updated_at
BEFORE UPDATE ON public.custom_field_definitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
