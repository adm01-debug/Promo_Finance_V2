-- 1. Fix RPCs for Conciliacao to match frontend parameters
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
    p_conciliacao_id UUID,
    p_user_id UUID,
    p_transacao_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE public.conciliacoes
    SET status = 'confirmado',
        confirmado_por = p_user_id,
        confirmado_em = now(),
        updated_at = now()
    WHERE id = p_conciliacao_id;
    
    -- If transaction ID is provided, mark it as reconciled too
    IF p_transacao_id IS NOT NULL THEN
        UPDATE public.transacoes_bancarias
        SET status = 'conciliado',
            updated_at = now()
        WHERE id = p_transacao_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(
    p_conciliacao_id UUID,
    p_transacao_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    DELETE FROM public.conciliacoes
    WHERE id = p_conciliacao_id;

    -- If transaction ID is provided, revert its status
    IF p_transacao_id IS NOT NULL THEN
        UPDATE public.transacoes_bancarias
        SET status = 'pendente',
            updated_at = now()
        WHERE id = p_transacao_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add transacao_conciliada_id to financial tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'transacao_conciliada_id') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN transacao_conciliada_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'transacao_conciliada_id') THEN
        ALTER TABLE public.contas_receber ADD COLUMN transacao_conciliada_id UUID;
    END IF;
END $$;

-- 3. Add score to acoes_recomendadas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'acoes_recomendadas' AND column_name = 'score') THEN
        ALTER TABLE public.acoes_recomendadas ADD COLUMN score NUMERIC(5,2);
    END IF;
END $$;

-- 4. Create missing tables for compliance and evidences
CREATE TABLE IF NOT EXISTS public.verificacoes_conformidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id),
    titulo TEXT NOT NULL,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evidencias_pacotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verificacao_id UUID REFERENCES public.verificacoes_conformidade(id),
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
