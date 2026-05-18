-- 1. Create plano_contas table
CREATE TABLE IF NOT EXISTS public.plano_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    user_id UUID REFERENCES auth.users(id),
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT,
    natureza TEXT,
    centro_resultado TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add columns to contas_receber and contas_pagar
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS categoria_nome TEXT;
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS etapa_cobranca TEXT;

ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS fornecedor_nome TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS categoria_nome TEXT;
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS centro_resultado TEXT;

-- 3. Fix RPC registrar_evento_receber
CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
    p_conta_id UUID,
    p_evento TEXT DEFAULT NULL,
    p_detalhes JSONB DEFAULT '{}'::jsonb,
    p_tipo TEXT DEFAULT 'sistema',
    p_mensagem TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.logs_baixa_automatica (
        conta_receber_id,
        evento,
        detalhes,
        tipo,
        mensagem,
        created_at
    ) VALUES (
        p_conta_id,
        COALESCE(p_evento, 'Evento'),
        COALESCE(p_metadata, p_detalhes),
        p_tipo,
        p_mensagem,
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create missing views (drop first to handle column changes)
DROP VIEW IF EXISTS public.vw_fluxo_caixa_diario;
CREATE OR REPLACE VIEW public.vw_fluxo_caixa_diario AS
SELECT 
    data_vencimento AS data,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) AS receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) AS despesas,
    empresa_id
FROM (
    SELECT data_vencimento, valor, 'receita' as tipo, empresa_id FROM public.contas_receber
    UNION ALL
    SELECT data_vencimento, valor, 'despesa' as tipo, empresa_id FROM public.contas_pagar
) combined
GROUP BY data_vencimento, empresa_id;

DROP VIEW IF EXISTS public.vw_metricas_cobranca;
CREATE OR REPLACE VIEW public.vw_metricas_cobranca AS
SELECT 
    COUNT(*) as total_cobrancas,
    SUM(CASE WHEN status = 'pago' THEN 1 ELSE 0 END) as total_pagas,
    SUM(CASE WHEN status = 'pendente' AND data_vencimento < CURRENT_DATE THEN 1 ELSE 0 END) as total_vencidas,
    empresa_id
FROM public.contas_receber
GROUP BY empresa_id;

DROP VIEW IF EXISTS public.vw_saldos_contas;
CREATE OR REPLACE VIEW public.vw_saldos_contas AS
SELECT 
    id as conta_id,
    banco,
    saldo_atual,
    saldo_disponivel,
    empresa_id
FROM public.contas_bancarias;

DROP VIEW IF EXISTS public.vw_webhooks_recentes;
CREATE OR REPLACE VIEW public.vw_webhooks_recentes AS
SELECT * FROM public.webhooks_log ORDER BY created_at DESC LIMIT 100;

-- 5. Enable RLS and add policies
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own plano_contas" ON public.plano_contas;
END $$;
CREATE POLICY "Users can manage their own plano_contas" ON public.plano_contas FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.plano_contas TO authenticated;
GRANT SELECT ON public.vw_fluxo_caixa_diario TO authenticated;
GRANT SELECT ON public.vw_metricas_cobranca TO authenticated;
GRANT SELECT ON public.vw_saldos_contas TO authenticated;
GRANT SELECT ON public.vw_webhooks_recentes TO authenticated;
