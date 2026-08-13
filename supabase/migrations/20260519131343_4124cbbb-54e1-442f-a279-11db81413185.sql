-- 1. Presets and Filters
ALTER TABLE public.user_filter_presets ADD COLUMN IF NOT EXISTS entity_type TEXT;

-- 2. Routing Rules
ALTER TABLE public.regras_roteamento_financeiro ADD COLUMN IF NOT EXISTS conta_bancaria_id UUID REFERENCES public.contas_bancarias(id);

-- 3. Financial Operations & Transactions
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.transacoes_bancarias ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.transacoes_bancarias ADD COLUMN IF NOT EXISTS saldo NUMERIC DEFAULT 0;

-- 4. Health Score table
CREATE TABLE IF NOT EXISTS public.health_scores_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    score NUMERIC DEFAULT 100,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. IA History
ALTER TABLE public.historico_conciliacao_ia ADD COLUMN IF NOT EXISTS conta_receber_id UUID REFERENCES public.contas_receber(id);
ALTER TABLE public.historico_conciliacao_ia ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id);

-- 6. Expert Messages Actions
ALTER TABLE public.expert_messages ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT '[]';

-- RLS for Health Score
ALTER TABLE public.health_scores_operacionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empresa access for health scores" ON public.health_scores_operacionais FOR SELECT USING (true);
