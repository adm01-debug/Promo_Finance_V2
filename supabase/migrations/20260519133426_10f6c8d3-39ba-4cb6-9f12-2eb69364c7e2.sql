CREATE TABLE IF NOT EXISTS public.alertas_preditivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID,
    tipo TEXT NOT NULL, -- 'inadimplencia', 'caixa', 'fiscal'
    titulo TEXT NOT NULL,
    descricao TEXT,
    probabilidade DECIMAL(5,2),
    valor_estimado DECIMAL(12,2),
    data_prevista DATE,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'ignorado', 'resolvido'
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.alertas_preditivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alertas preditivos visualizáveis por todos da empresa" ON public.alertas_preditivos
    FOR SELECT USING (true);
