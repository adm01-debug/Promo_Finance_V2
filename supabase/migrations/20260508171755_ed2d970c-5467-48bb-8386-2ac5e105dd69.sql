-- 1. Extend boletos table for tracking and payables reference
ALTER TABLE public.boletos 
ADD COLUMN IF NOT EXISTS rastreio_status JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS conta_pagar_id UUID REFERENCES public.contas_pagar(id);

-- 2. Enhance transacoes_bancarias for better audit and status
ALTER TABLE public.transacoes_bancarias
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'estornado')),
ADD COLUMN IF NOT EXISTS regra_id UUID REFERENCES public.regras_conciliacao(id),
ADD COLUMN IF NOT EXISTS data_confirmacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmado_por UUID REFERENCES auth.users(id);

-- Update existing reconciled transactions (using created_at since updated_at might not exist on this table)
UPDATE public.transacoes_bancarias 
SET status = 'confirmado', data_confirmacao = created_at 
WHERE conciliada = true;

-- 3. Add AI negotiation config to regua_cobranca
ALTER TABLE public.regua_cobranca
ADD COLUMN IF NOT EXISTS configuracoes_ia JSONB DEFAULT '{"permitir_negociacao": false, "desconto_maximo": 10, "parcelas_maximas": 3}';

-- 4. Create function to undo reconciliation
CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(
    p_transacao_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
DECLARE
    v_conta_receber_id UUID;
    v_conta_pagar_id UUID;
BEGIN
    -- Find references
    SELECT conta_receber_id, conta_pagar_id INTO v_conta_receber_id, v_conta_pagar_id
    FROM public.transacoes_bancarias
    WHERE id = p_transacao_id;

    -- Update bank transaction
    UPDATE public.transacoes_bancarias
    SET 
        conciliada = false,
        status = 'pendente',
        conta_receber_id = NULL,
        conta_pagar_id = NULL,
        compensacao_valor = 0,
        compensacao_motivo = NULL,
        data_confirmacao = NULL,
        confirmado_por = NULL
    WHERE id = p_transacao_id;

    -- Update account receivable if applicable
    IF v_conta_receber_id IS NOT NULL THEN
        UPDATE public.contas_receber
        SET 
            status = 'pendente',
            valor_recebido = 0,
            data_recebimento = NULL,
            conta_bancaria_id = NULL,
            transacao_conciliada_id = NULL
        WHERE id = v_conta_receber_id;

        -- Log undo event
        PERFORM public.registrar_evento_receber(
            v_conta_receber_id,
            'conciliacao_desfeita',
            'Conciliação bancária desfeita pelo usuário.',
            jsonb_build_object('transacao_id', p_transacao_id, 'user_id', p_user_id)
        );
    END IF;

    -- Update account payable if applicable
    IF v_conta_pagar_id IS NOT NULL THEN
        UPDATE public.contas_pagar
        SET 
            status = 'pendente',
            valor_pago = 0,
            data_pagamento = NULL,
            conta_bancaria_id = NULL
        WHERE id = v_conta_pagar_id;

        -- Log undo event
        PERFORM public.registrar_evento_pagar(
            v_conta_pagar_id,
            'conciliacao_desfeita',
            'Conciliação bancária desfeita pelo usuário.',
            jsonb_build_object('transacao_id', p_transacao_id, 'user_id', p_user_id)
        );
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
