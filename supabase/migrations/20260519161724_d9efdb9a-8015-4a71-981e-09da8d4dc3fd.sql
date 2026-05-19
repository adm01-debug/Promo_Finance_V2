-- Create regimes_simulados table
CREATE TABLE IF NOT EXISTS public.regimes_simulados (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    ano_referencia INTEGER NOT NULL,
    rbt12 DECIMAL(15,2),
    folha_12m DECIMAL(15,2),
    fator_r DECIMAL(5,4),
    regime_atual TEXT,
    regime_recomendado TEXT NOT NULL,
    cenarios JSONB NOT NULL DEFAULT '[]',
    alertas JSONB NOT NULL DEFAULT '[]',
    justificativa TEXT,
    economia_anual_estimada DECIMAL(15,2),
    parametros JSONB NOT NULL DEFAULT '{}',
    audit_log_id UUID,
    created_by UUID REFERENCES auth.users(id),
    data_simulacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regimes_simulados ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view simulation history" 
ON public.regimes_simulados 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
));

CREATE POLICY "Users can insert simulations" 
ON public.regimes_simulados 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_regimes_simulados_empresa ON public.regimes_simulados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_regimes_simulados_data ON public.regimes_simulados(data_simulacao);