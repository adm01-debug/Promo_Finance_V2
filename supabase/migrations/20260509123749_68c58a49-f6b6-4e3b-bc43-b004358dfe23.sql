-- Create Action Plans table
CREATE TABLE IF NOT EXISTS public.planos_acao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')) DEFAULT 'media',
    status TEXT CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')) DEFAULT 'pendente',
    prazo TIMESTAMP WITH TIME ZONE,
    responsavel TEXT,
    progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Action Plans
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own action plans"
ON public.planos_acao
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create Operational KPIs table
CREATE TABLE IF NOT EXISTS public.kpis_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor_atual NUMERIC DEFAULT 0,
    meta NUMERIC DEFAULT 0,
    unidade TEXT,
    tendencia TEXT CHECK (tendencia IN ('subindo', 'descendo', 'estavel')),
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for Operational KPIs
ALTER TABLE public.kpis_operacionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own operational KPIs"
ON public.kpis_operacionais
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_planos_acao_updated_at
BEFORE UPDATE ON public.planos_acao
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_operacionais_updated_at
BEFORE UPDATE ON public.kpis_operacionais
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();