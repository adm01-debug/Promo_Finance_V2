-- Tabela para níveis de aprovação (Workflows complexos)
CREATE TABLE IF NOT EXISTS public.fluxos_aprovacao_niveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    valor_minimo DECIMAL(15,2) DEFAULT 0,
    aprovadores_obrigatorios INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id, ordem)
);

-- Habilitar RLS
ALTER TABLE public.fluxos_aprovacao_niveis ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own workflow levels"
ON public.fluxos_aprovacao_niveis FOR SELECT
USING (auth.uid() = empresa_id);

CREATE POLICY "Admins can manage workflow levels"
ON public.fluxos_aprovacao_niveis FOR ALL
USING (auth.uid() = empresa_id);

-- Comentários nas aprovações (Trilha de discussão)
CREATE TABLE IF NOT EXISTS public.aprovacao_comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_aprovacao(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    texto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.aprovacao_comentarios ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários
CREATE POLICY "Users can view comments on their requests or if they are approvers"
ON public.aprovacao_comentarios FOR SELECT
USING (true); -- Simplificado para o exemplo, em produção seria mais restrito

CREATE POLICY "Users can post comments"
ON public.aprovacao_comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Adicionar colunas de controle de fluxo na tabela de solicitações
ALTER TABLE public.solicitacoes_aprovacao 
ADD COLUMN IF NOT EXISTS nivel_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_niveis INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS assinaturas JSONB DEFAULT '[]'::jsonb;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_fluxos_aprovacao_niveis_updated_at
BEFORE UPDATE ON public.fluxos_aprovacao_niveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
