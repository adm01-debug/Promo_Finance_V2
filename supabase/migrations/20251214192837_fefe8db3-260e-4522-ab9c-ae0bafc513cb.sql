-- Create table for scheduled reports configuration
CREATE TABLE public.relatorios_agendados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo_relatorio VARCHAR(100) NOT NULL, -- 'fluxo_caixa', 'contas_pagar', 'contas_receber', 'dre', 'balanco'
  frequencia VARCHAR(50) NOT NULL, -- 'diario', 'semanal', 'mensal'
  dia_semana INTEGER, -- 0-6 for weekly reports
  dia_mes INTEGER, -- 1-31 for monthly reports
  hora_execucao TIME NOT NULL DEFAULT '08:00',
  empresa_id UUID REFERENCES public.empresas(id),
  centro_custo_id UUID REFERENCES public.centros_custo(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_envio TIMESTAMP WITH TIME ZONE,
  proximo_envio TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for report execution history
CREATE TABLE public.historico_relatorios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relatorio_agendado_id UUID REFERENCES public.relatorios_agendados(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'gerado', -- 'gerado', 'enviado', 'erro'
  dados_relatorio JSONB,
  erro_mensagem TEXT,
  executado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relatorios_agendados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_relatorios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for relatorios_agendados
CREATE POLICY "Users can view scheduled reports" 
ON public.relatorios_agendados 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create scheduled reports" 
ON public.relatorios_agendados 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their scheduled reports" 
ON public.relatorios_agendados 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their scheduled reports" 
ON public.relatorios_agendados 
FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for historico_relatorios
CREATE POLICY "Users can view report history" 
ON public.historico_relatorios 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert report history" 
ON public.historico_relatorios 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_relatorios_agendados_updated_at
BEFORE UPDATE ON public.relatorios_agendados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();