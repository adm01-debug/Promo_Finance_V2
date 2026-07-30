-- Create custom_field_definitions
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'cliente', 'fornecedor', 'conta_pagar', etc
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'date', 'boolean', 'select'
    options JSONB, -- For 'select' type
    is_required BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create custom_field_values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id UUID REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(definition_id, entity_id)
);

-- Update notas_fiscais
ALTER TABLE public.notas_fiscais 
ADD COLUMN IF NOT EXISTS valor_produtos NUMERIC DEFAULT 0;

-- Enable RLS
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own custom field definitions" 
ON public.custom_field_definitions
FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.empresa_id = custom_field_definitions.empresa_id
));

CREATE POLICY "Users can manage their own custom field values" 
ON public.custom_field_values
FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles p 
    JOIN custom_field_definitions d ON d.empresa_id = p.empresa_id
    WHERE p.id = auth.uid() AND custom_field_values.definition_id = d.id
));