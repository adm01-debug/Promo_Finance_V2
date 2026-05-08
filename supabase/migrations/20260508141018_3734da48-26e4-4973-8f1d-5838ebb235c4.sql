-- Tabela de auditoria de elegibilidade de créditos
CREATE TABLE public.elisao_creditos_auditoria (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nota_fiscal_id UUID NOT NULL, -- Referência ao documento original
    ncm TEXT NOT NULL,
    cst_csosn TEXT,
    valor_base DECIMAL(15,2) NOT NULL,
    valor_credito_calculado DECIMAL(15,2) NOT NULL,
    regra_id UUID REFERENCES public.elisao_regras_creditos(id),
    status_validacao TEXT DEFAULT 'pendente', -- 'pendente', 'elegivel', 'inelegivel'
    motivo_rejeicao TEXT,
    metodologia_aplicada TEXT,
    evidencias JSONB DEFAULT '[]', -- Lista de IDs de anexos ou metadados
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de acionáveis (Régua de Tarefas)
CREATE TABLE public.elisao_tarefas_acionaveis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo_oportunidade TEXT, -- 'recuperacao_pis_cofins', 'ajuste_icms_st', 'planejamento_regime'
    valor_envolvido DECIMAL(15,2),
    responsavel_id UUID REFERENCES auth.users(id),
    prazo DATE,
    status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'canceled'
    checklist JSONB DEFAULT '[]', -- [{ "item": "Coletar XMLs", "done": false }, ...]
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.elisao_creditos_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elisao_tarefas_acionaveis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage company audit logs" 
ON public.elisao_creditos_auditoria FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

CREATE POLICY "Users can manage company action tasks" 
ON public.elisao_tarefas_acionaveis FOR ALL 
USING (empresa_id IN (SELECT id FROM public.empresas));

-- Trigger para updated_at nas tarefas
CREATE TRIGGER update_elisao_tarefas_updated_at
BEFORE UPDATE ON public.elisao_tarefas_acionaveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
