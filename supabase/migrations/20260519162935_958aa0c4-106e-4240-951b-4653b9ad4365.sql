-- Tabela para gerenciar as rodadas de simulação
CREATE TABLE IF NOT EXISTS public.webhook_simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    total_scenarios INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    error_summary JSONB,
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela para detalhes de cada cenário testado
CREATE TABLE IF NOT EXISTS public.webhook_simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.webhook_simulation_runs(id) ON DELETE CASCADE,
    scenario_name TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body JSONB,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.webhook_simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_simulation_results ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso simplificadas
CREATE POLICY "Users can view simulation runs" 
ON public.webhook_simulation_runs FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert simulation runs" 
ON public.webhook_simulation_runs FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view simulation results" 
ON public.webhook_simulation_results FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.webhook_simulation_runs WHERE id = run_id AND created_by = auth.uid()));

-- Índices para performance
CREATE INDEX idx_simulation_results_run_id ON public.webhook_simulation_results(run_id);
CREATE INDEX idx_simulation_results_success ON public.webhook_simulation_results(success);