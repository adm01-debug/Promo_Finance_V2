-- 1. contas_bancarias
CREATE TABLE IF NOT EXISTS public.contas_bancarias (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    banco TEXT,
    agencia TEXT,
    numero_conta TEXT,
    saldo_inicial NUMERIC DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. transacoes_bancarias (ajustes)
ALTER TABLE public.transacoes_bancarias 
ADD COLUMN IF NOT EXISTS compensacao_valor NUMERIC,
ADD COLUMN IF NOT EXISTS compensacao_aceita_por UUID,
ADD COLUMN IF NOT EXISTS compensacao_aceita_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS compensacao_regra TEXT,
ADD COLUMN IF NOT EXISTS compensacao_motivo TEXT;

-- 3. divergencias_conciliacao
CREATE TABLE IF NOT EXISTS public.divergencias_conciliacao (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transacao_id UUID REFERENCES public.transacoes_bancarias(id),
    descricao TEXT,
    valor_divergencia NUMERIC,
    resolvida BOOLEAN DEFAULT false,
    resolvida_por UUID,
    resolvida_em TIMESTAMP WITH TIME ZONE,
    empresa_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergencias_conciliacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accounts" ON public.contas_bancarias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view discrepancies" ON public.divergencias_conciliacao FOR SELECT TO authenticated USING (true);
