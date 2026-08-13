-- 1. Auditoria Estendida para Tabelas Asaas
DROP TRIGGER IF EXISTS audit_asaas_payments ON public.asaas_payments;
CREATE TRIGGER audit_asaas_payments
AFTER INSERT OR UPDATE OR DELETE ON public.asaas_payments
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_asaas_transfers ON public.asaas_transfers;
CREATE TRIGGER audit_asaas_transfers
AFTER INSERT OR UPDATE OR DELETE ON public.asaas_transfers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- 2. Função de Liquidação Automática (Settlement)
CREATE OR REPLACE FUNCTION public.handle_asaas_payment_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_conta_receber_id uuid;
    v_valor_recebido numeric;
    v_valor_liquido numeric;
    v_taxa_gateway numeric;
    v_data_pagamento date;
    v_empresa_id uuid;
    v_conta_bancaria_id uuid;
    v_descricao text;
BEGIN
    -- Só processa se o status mudar para RECEIVED ou CONFIRMED (e não estava assim antes)
    IF (NEW.status IN ('RECEIVED', 'CONFIRMED') AND (OLD.status IS NULL OR OLD.status NOT IN ('RECEIVED', 'CONFIRMED'))) THEN
        
        v_conta_receber_id := NEW.conta_receber_id;
        v_valor_recebido := NEW.valor;
        v_valor_liquido := COALESCE(NEW.valor_liquido, NEW.valor);
        v_taxa_gateway := v_valor_recebido - v_valor_liquido;
        v_data_pagamento := COALESCE(NEW.data_pagamento, CURRENT_DATE);
        v_empresa_id := NEW.empresa_id;
        
        -- Busca conta bancária associada (tenta pelo ID guardado ou pega a primeira da empresa se não houver)
        -- Nota: asaas_payments guarda conta_bancaria como TEXT ou ID. Vamos tentar resolver.
        SELECT id INTO v_conta_bancaria_id 
        FROM public.contas_bancarias 
        WHERE empresa_id = v_empresa_id 
        ORDER BY created_at ASC 
        LIMIT 1;

        IF v_conta_receber_id IS NOT NULL THEN
            -- A. Atualiza Conta a Receber
            UPDATE public.contas_receber 
            SET 
                status = 'pago',
                valor_recebido = v_valor_recebido,
                valor_pago = v_valor_recebido,
                valor_liquido = v_valor_liquido,
                taxa_gateway = v_taxa_gateway,
                data_recebimento = v_data_pagamento,
                updated_at = NOW()
            WHERE id = v_conta_receber_id;

            -- B. Cria Movimentação Bancária (Entrada)
            v_descricao := 'Liquidação Automática Asaas: ' || COALESCE(NEW.descricao, 'Sem descrição');
            
            INSERT INTO public.movimentacoes (
                empresa_id,
                conta_bancaria_id,
                conta_receber_id,
                tipo,
                descricao,
                valor,
                valor_liquido,
                taxa_gateway,
                data_movimentacao,
                data_competencia,
                origem,
                asaas_transaction_id,
                asaas_type
            ) VALUES (
                v_empresa_id,
                v_conta_bancaria_id,
                v_conta_receber_id,
                'entrada',
                v_descricao,
                v_valor_recebido,
                v_valor_liquido,
                v_taxa_gateway,
                v_data_pagamento,
                v_data_pagamento,
                'asaas',
                NEW.asaas_id,
                NEW.tipo
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger de Liquidação
DROP TRIGGER IF EXISTS trigger_asaas_settlement ON public.asaas_payments;
CREATE TRIGGER trigger_asaas_settlement
AFTER UPDATE ON public.asaas_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_asaas_payment_settlement();
