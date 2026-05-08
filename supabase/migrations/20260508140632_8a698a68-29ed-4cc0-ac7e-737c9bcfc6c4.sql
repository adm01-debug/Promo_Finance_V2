-- Tabela para simulações de regimes tributários
CREATE TABLE public.elisao_simulacoes_regime (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ano_base INTEGER NOT NULL,
    dados_faturamento JSONB NOT NULL DEFAULT '{}', -- Mensal: { "jan": 10000, ... }
    dados_despesas JSONB NOT NULL DEFAULT '{}',
    resultado_simples JSONB,
    resultado_presumido JSONB,
    resultado_real JSONB,
    resultado_reforma_transicao JSONB, -- Projeção CBS/IBS
    criado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de inteligência de créditos (NCM/Produtos)
CREATE TABLE public.elisao_regras_creditos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ncm TEXT NOT NULL,
    descricao TEXT,
    tipo_credito TEXT NOT NULL, -- 'monofasico', 'isento', 'substituicao_tributaria', 'exclusao_base'
    aliquota_pis_reducao DECIMAL(5,4) DEFAULT 0,
    aliquota_cofins_reducao DECIMAL(5,4) DEFAULT 0,
    fundamentacao_legal TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de análise de Gap Fiscal (Resultados)
CREATE TABLE public.elisao_analise_gap (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    periodo_referencia DATE NOT NULL,
    valor_pago_efetivo DECIMAL(15,2) NOT NULL,
    valor_otimizado_projetado DECIMAL(15,2) NOT NULL,
    economia_identificada DECIMAL(15,2) GENERATED ALWAYS AS (valor_pago_efetivo - valor_otimizado_projetado) STORED,
    detalhes_oportunidades JSONB NOT NULL DEFAULT '[]',
    status TEXT DEFAULT 'oportunidade_detectada', -- 'oportunidade_detectada', 'em_implementacao', 'economizado'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.elisao_simulacoes_regime ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_regras_creditos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_analise_gap ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their company simulations" 
ON public.elisao_simulacoes_regime FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Everyone can view tax rules" 
ON public.elisao_regras_creditos FOR SELECT 
USING (true);

CREATE POLICY "Users can view their company gap analysis" 
ON public.elisao_analise_gap FOR SELECT 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Gatilho para updated_at
CREATE TRIGGER update_elisao_simulacoes_updated_at
BEFORE UPDATE ON public.elisao_simulacoes_regime
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
