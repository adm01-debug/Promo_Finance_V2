-- Tabela para controle de obrigações acessórias
CREATE TABLE IF NOT EXISTS public.obrigacoes_acessorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    esfera TEXT NOT NULL CHECK (esfera IN ('federal', 'estadual', 'municipal')),
    periodicidade TEXT NOT NULL,
    competencia TEXT NOT NULL, -- Formato MM/YYYY
    vencimento DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'transmitida', 'atrasada', 'nao_aplicavel')),
    transmitida_em TIMESTAMP WITH TIME ZONE,
    protocolo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.obrigacoes_acessorias ENABLE ROW LEVEL SECURITY;

-- Políticas para obrigacoes_acessorias
CREATE POLICY "Users can view their company obligations"
    ON public.obrigacoes_acessorias
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'financeiro', 'visualizador')
    ));

CREATE POLICY "Users can manage their company obligations"
    ON public.obrigacoes_acessorias
    FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role IN ('admin', 'financeiro')
    ));

-- Tabela para glossário tributário (global/compartilhada)
CREATE TABLE IF NOT EXISTS public.glossario_tributario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    termo TEXT NOT NULL UNIQUE,
    significado TEXT NOT NULL,
    categoria TEXT, -- Ex: 'Reforma Tributária', 'Geral', 'Simples Nacional'
    base_legal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.glossario_tributario ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública para o glossário
CREATE POLICY "Anyone can view glossary"
    ON public.glossario_tributario
    FOR SELECT
    USING (true);

-- Inserir termos básicos no glossário
INSERT INTO public.glossario_tributario (termo, significado, categoria, base_legal) VALUES
('CBS', 'Contribuição sobre Bens e Serviços. Tributo federal que substitui PIS e COFINS.', 'Reforma Tributária', 'EC 132/2023'),
('IBS', 'Imposto sobre Bens e Serviços. Tributo subnacional (estados e municípios) que substitui ICMS e ISS.', 'Reforma Tributária', 'EC 132/2023'),
('IS', 'Imposto Seletivo (ou "Imposto do Pecado"). Tributo federal sobre produtos nocivos à saúde ou ao meio ambiente.', 'Reforma Tributária', 'EC 132/2023'),
('Split Payment', 'Mecanismo de recolhimento automático do tributo no momento da liquidação financeira da operação.', 'Reforma Tributária', 'LC 214/2025'),
('Cashback Tributário', 'Devolução de parte do IBS e da CBS para famílias de baixa renda.', 'Reforma Tributária', 'EC 132/2023'),
('IVA Dual', 'Modelo tributário composto por dois impostos sobre o valor adicionado (CBS e IBS).', 'Reforma Tributária', 'EC 132/2023'),
('Não-Cumulatividade Plena', 'Regime que permite o aproveitamento integral de créditos tributários sobre todas as aquisições da empresa.', 'Reforma Tributária', 'EC 132/2023'),
('Princípio do Destino', 'A tributação ocorre no local onde o bem ou serviço é consumido, e não onde é produzido.', 'Reforma Tributária', 'EC 132/2023')
ON CONFLICT (termo) DO NOTHING;

-- Trigger para updated_at
CREATE TRIGGER update_obrigacoes_acessorias_updated_at
BEFORE UPDATE ON public.obrigacoes_acessorias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
