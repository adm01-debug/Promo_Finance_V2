-- Create tax audit trail table
CREATE TABLE public.tax_audit_trail (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'simulated', 'cache_hit', 'pdf_generated'
    parameters JSONB,
    prompt TEXT,
    response TEXT,
    is_ai_justified BOOLEAN DEFAULT FALSE,
    cache_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_audit_trail ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view audit trail of their companies"
ON public.tax_audit_trail
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_empresas
        WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id
        AND user_empresas.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert audit trail entries"
ON public.tax_audit_trail
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_empresas
        WHERE user_empresas.empresa_id = tax_audit_trail.empresa_id
        AND user_empresas.user_id = auth.uid()
    )
);

-- Index for performance
CREATE INDEX idx_tax_audit_empresa ON public.tax_audit_trail(empresa_id, ano, mes);
