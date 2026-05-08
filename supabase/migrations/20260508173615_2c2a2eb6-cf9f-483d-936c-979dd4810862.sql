-- Adicionar coluna para ID externo do ASAAS ou outros provedores
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS asaas_id TEXT;
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS external_provider TEXT DEFAULT 'asaas';

-- Garantir que temos uma tabela de logs para eventos de boletos se não existir
CREATE TABLE IF NOT EXISTS public.boleto_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boleto_id UUID REFERENCES public.boletos(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status_before TEXT,
    status_after TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de eventos
ALTER TABLE public.boleto_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events of their companies' boletos"
ON public.boleto_events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.boletos b
        JOIN public.user_roles ur ON ur.user_id = auth.uid()
        WHERE b.id = boleto_events.boleto_id
    )
);

-- Função para atualizar automaticamente a conta vinculada quando o boleto mudar para pago
CREATE OR REPLACE FUNCTION public.handle_boleto_payment_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status mudou para 'pago'
    IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
        -- Atualizar conta a receber se houver
        IF NEW.conta_receber_id IS NOT NULL THEN
            UPDATE public.contas_receber
            SET status = 'pago', 
                data_recebimento = COALESCE(NEW.updated_at, now())::date,
                updated_at = now()
            WHERE id = NEW.conta_receber_id;
            
            -- Registrar evento na conta a receber
            INSERT INTO public.contas_receber_eventos (conta_id, tipo, mensagem, metadata)
            VALUES (NEW.conta_receber_id, 'pagamento_confirmado', 'Pagamento confirmado via boleto #' || NEW.numero, jsonb_build_object('boleto_id', NEW.id));
        END IF;

        -- Atualizar conta a pagar se houver
        IF NEW.conta_pagar_id IS NOT NULL THEN
            UPDATE public.contas_pagar
            SET status = 'pago', 
                data_pagamento = COALESCE(NEW.updated_at, now())::date,
                updated_at = now()
            WHERE id = NEW.conta_pagar_id;

             -- Registrar evento na conta a pagar
            INSERT INTO public.contas_pagar_eventos (conta_id, tipo, mensagem, metadata)
            VALUES (NEW.conta_pagar_id, 'pagamento_confirmado', 'Pagamento confirmado via boleto #' || NEW.numero, jsonb_build_object('boleto_id', NEW.id));
        END IF;
    END IF;

    -- Registrar evento de mudança de status
    IF NEW.status != OLD.status THEN
        INSERT INTO public.boleto_events (boleto_id, event_type, status_before, status_after, description)
        VALUES (NEW.id, 'status_change', OLD.status, NEW.status, 'Status alterado de ' || OLD.status || ' para ' || NEW.status);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronização de pagamento
DROP TRIGGER IF EXISTS on_boleto_status_change ON public.boletos;
CREATE TRIGGER on_boleto_status_change
AFTER UPDATE ON public.boletos
FOR EACH ROW
EXECUTE FUNCTION public.handle_boleto_payment_sync();
