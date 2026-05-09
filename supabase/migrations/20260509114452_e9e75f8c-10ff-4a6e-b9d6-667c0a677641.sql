-- Tabela de Regras de Roteamento Financeiro
CREATE TABLE IF NOT EXISTS public.regras_roteamento_financeiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    prioridade INTEGER DEFAULT 0,
    condicoes JSONB NOT NULL DEFAULT '{}', -- Ex: { "tipo": "servico", "valor_min": 1000 }
    conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Histórico de Cobranças (específica para boletos)
CREATE TABLE IF NOT EXISTS public.historico_cobrancas_boletos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boleto_id UUID NOT NULL REFERENCES public.boletos(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL, -- Ex: 'envio_email', 'visualizacao', 'baixa_automatica', 'tentativa_falha'
    descricao TEXT,
    metadados JSONB DEFAULT '{}',
    ip_origem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para Controle de Importação de Extratos
CREATE TABLE IF NOT EXISTS public.extratos_bancarios_importados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    hash_arquivo TEXT UNIQUE, -- Para evitar re-importação do mesmo arquivo
    data_inicio DATE,
    data_fim DATE,
    total_transacoes INTEGER,
    metadados JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.regras_roteamento_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_cobrancas_boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos_bancarios_importados ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their company routing rules"
ON public.regras_roteamento_financeiro FOR SELECT
USING (EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id));

CREATE POLICY "Users can manage their company routing rules"
ON public.regras_roteamento_financeiro FOR ALL
USING (EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = empresa_id));

CREATE POLICY "Users can view boleto history"
ON public.historico_cobrancas_boletos FOR SELECT
USING (EXISTS (SELECT 1 FROM public.boletos b JOIN public.empresas e ON b.empresa_id = e.id WHERE b.id = boleto_id));

CREATE POLICY "Users can view their bank imports"
ON public.extratos_bancarios_importados FOR SELECT
USING (EXISTS (SELECT 1 FROM public.contas_bancarias c WHERE c.id = conta_bancaria_id));

-- Trigger para updated_at
CREATE TRIGGER update_regras_roteamento_updated_at
BEFORE UPDATE ON public.regras_roteamento_financeiro
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
