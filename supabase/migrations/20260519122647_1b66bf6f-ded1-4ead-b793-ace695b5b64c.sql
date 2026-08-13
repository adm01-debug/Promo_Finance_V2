-- 1. Fix verificacoes_conformidade
ALTER TABLE public.verificacoes_conformidade ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);

-- 2. Update Conciliacao RPCs to be more flexible (handling both CP/CR and Transacao)
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
    p_conciliacao_id UUID,
    p_user_id UUID,
    p_transacao_id UUID DEFAULT NULL,
    p_conta_pagar_id UUID DEFAULT NULL,
    p_conta_receber_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE public.conciliacoes
    SET status = 'confirmado',
        confirmado_por = p_user_id,
        confirmado_em = now(),
        updated_at = now()
    WHERE id = p_conciliacao_id;
    
    IF p_transacao_id IS NOT NULL THEN
        UPDATE public.transacoes_bancarias SET status = 'conciliado' WHERE id = p_transacao_id;
    END IF;
    
    IF p_conta_pagar_id IS NOT NULL THEN
        UPDATE public.contas_pagar SET status = 'pago', data_pagamento = now() WHERE id = p_conta_pagar_id;
    END IF;

    IF p_conta_receber_id IS NOT NULL THEN
        UPDATE public.contas_receber SET status = 'recebido', data_recebimento = now() WHERE id = p_conta_receber_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(
    p_conciliacao_id UUID,
    p_transacao_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL -- Added to match frontend call
) RETURNS VOID AS $$
BEGIN
    DELETE FROM public.conciliacoes
    WHERE id = p_conciliacao_id;

    IF p_transacao_id IS NOT NULL THEN
        UPDATE public.transacoes_bancarias SET status = 'pendente' WHERE id = p_transacao_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix Bitrix Field Mappings
ALTER TABLE public.bitrix_field_mappings ADD COLUMN IF NOT EXISTS obrigatorio BOOLEAN DEFAULT false;
ALTER TABLE public.bitrix_field_mappings ADD COLUMN IF NOT EXISTS transformacao TEXT;

-- 4. Final check for login_attempts
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS user_email TEXT;
