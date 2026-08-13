-- 1. transacoes_bancarias (status e flags)
ALTER TABLE public.transacoes_bancarias 
ADD COLUMN IF NOT EXISTS conciliada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compensacao_classificacao TEXT,
ADD COLUMN IF NOT EXISTS compensacao_evidencia_url TEXT;

-- 2. divergencias_conciliacao (campos de resolução)
ALTER TABLE public.divergencias_conciliacao 
ADD COLUMN IF NOT EXISTS tipo_divergencia TEXT,
ADD COLUMN IF NOT EXISTS resolvido_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMP WITH TIME ZONE;

-- 3. regras_conciliacao
CREATE TABLE IF NOT EXISTS public.regras_conciliacao (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    padrao_descricao TEXT,
    valor_exato NUMERIC,
    categoria_id UUID,
    ativo BOOLEAN DEFAULT true,
    vezes_aplicada INTEGER DEFAULT 0,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. feedback_conciliacao_ia
CREATE TABLE IF NOT EXISTS public.feedback_conciliacao_ia (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transacao_id UUID REFERENCES public.transacoes_bancarias(id),
    user_id UUID REFERENCES auth.users(id),
    acao TEXT NOT NULL, -- aceitou, rejeitou, corrigiu
    feedback_texto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. RLS
ALTER TABLE public.regras_conciliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_conciliacao_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rules" ON public.regras_conciliacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage feedback" ON public.feedback_conciliacao_ia FOR ALL TO authenticated USING (auth.uid() = user_id);
