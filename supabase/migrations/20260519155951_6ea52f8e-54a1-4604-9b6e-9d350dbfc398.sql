-- Função para confirmar conciliação manual
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(
    p_transacao_id UUID,
    p_conta_pagar_id UUID DEFAULT NULL,
    p_conta_receber_id UUID DEFAULT NULL,
    p_ajuste_centavos NUMERIC DEFAULT 0
)
RETURNS void AS $$
BEGIN
    -- Marcar a transação como confirmada
    UPDATE public.transacoes_bancarias
    SET status = 'confirmado',
        data_confirmacao = now(),
        updated_at = now()
    WHERE id = p_transacao_id;

    -- Vincular na conta pagar se existir
    IF p_conta_pagar_id IS NOT NULL THEN
        UPDATE public.contas_pagar
        SET status = 'pago',
            data_pagamento = COALESCE(data_pagamento, (SELECT data FROM public.transacoes_bancarias WHERE id = p_transacao_id)),
            valor_pago = valor,
            updated_at = now()
        WHERE id = p_conta_pagar_id;
    END IF;

    -- Vincular na conta receber se existir
    IF p_conta_receber_id IS NOT NULL THEN
        UPDATE public.contas_receber
        SET status = 'pago',
            data_recebimento = COALESCE(data_recebimento, (SELECT data FROM public.transacoes_bancarias WHERE id = p_transacao_id)),
            valor_recebido = valor,
            transacao_conciliada_id = p_transacao_id,
            updated_at = now()
        WHERE id = p_conta_receber_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para desfazer conciliação manual
CREATE OR REPLACE FUNCTION public.desfazer_conciliacao_manual(
    p_transacao_id UUID
)
RETURNS void AS $$
BEGIN
    -- Resetar status da transação
    UPDATE public.transacoes_bancarias
    SET status = 'pendente',
        data_confirmacao = NULL,
        confirmado_por = NULL,
        updated_at = now()
    WHERE id = p_transacao_id;

    -- Desvincular de contas_receber
    UPDATE public.contas_receber
    SET transacao_conciliada_id = NULL,
        status = CASE WHEN data_vencimento < now()::date THEN 'vencido' ELSE 'pendente' END,
        updated_at = now()
    WHERE transacao_conciliada_id = p_transacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
