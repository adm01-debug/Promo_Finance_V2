-- 1. Final polish on Conciliacao RPCs to cover all frontend use cases
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
    p_conciliacao_id UUID,
    p_user_id UUID,
    p_transacao_id UUID DEFAULT NULL,
    p_conta_pagar_id UUID DEFAULT NULL,
    p_conta_receber_id UUID DEFAULT NULL,
    p_ajuste_centavos NUMERIC DEFAULT 0
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
        UPDATE public.contas_pagar SET status = 'pago', data_pagamento = now(), valor_pago = valor + p_ajuste_centavos WHERE id = p_conta_pagar_id;
    END IF;

    IF p_conta_receber_id IS NOT NULL THEN
        UPDATE public.contas_receber SET status = 'recebido', data_recebimento = now(), valor_recebido = valor + p_ajuste_centavos WHERE id = p_conta_receber_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(
    p_conciliacao_id UUID,
    p_transacao_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    DELETE FROM public.conciliacoes
    WHERE id = p_conciliacao_id;

    IF p_transacao_id IS NOT NULL THEN
        UPDATE public.transacoes_bancarias SET status = 'pendente' WHERE id = p_transacao_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add missing business columns
ALTER TABLE public.creditos_tributarios ADD COLUMN IF NOT EXISTS valor_credito NUMERIC(15,2);

-- 3. Create view for extratos_bancarios_importados if missing (used in hooks)
CREATE OR REPLACE VIEW public.extratos_bancarios_importados AS 
SELECT * FROM public.extrato_bancario;
