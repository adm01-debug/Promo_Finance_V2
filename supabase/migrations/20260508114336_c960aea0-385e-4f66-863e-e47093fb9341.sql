-- Contas a Receber Governance Improvements

-- 1. Add tracking columns to existing tables
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS transacao_conciliada_id UUID REFERENCES public.transacoes_bancarias(id);
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{"events": []}'::jsonb;

ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS transacao_conciliada_id UUID REFERENCES public.transacoes_bancarias(id);

-- 2. Configuration table for receivables
CREATE TABLE IF NOT EXISTS public.configuracoes_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) UNIQUE,
    regua_ativa BOOLEAN DEFAULT false,
    regua_config JSONB DEFAULT '{
        "lembrete_preventivo": {"dias": -2, "ativo": true, "canal": "email"},
        "vencimento_hoje": {"dias": 0, "ativo": true, "canal": "whatsapp"},
        "cobranca_nivel_1": {"dias": 3, "ativo": true, "canal": "email"},
        "cobranca_nivel_2": {"dias": 10, "ativo": true, "canal": "whatsapp"}
    }'::jsonb,
    baixa_automatica_ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.configuracoes_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their company settings" ON public.configuracoes_receber FOR ALL USING (true);

-- 3. Execution log for billing rules (Régua de Cobrança)
CREATE TABLE IF NOT EXISTS public.execucoes_regua_cobranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    conta_receber_id UUID NOT NULL REFERENCES public.contas_receber(id),
    etapa TEXT NOT NULL, -- preventiva, hoje, atraso_1, etc
    canal TEXT NOT NULL, -- email, whatsapp
    status TEXT NOT NULL, -- sucesso, erro
    mensagem_erro TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.execucoes_regua_cobranca ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their billing executions" ON public.execucoes_regua_cobranca FOR SELECT USING (true);

-- 4. Automatic reconciliation/write-off logs
CREATE TABLE IF NOT EXISTS public.logs_baixa_automatica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id),
    arquivo_nome TEXT NOT NULL,
    total_registros INTEGER NOT NULL,
    sucesso_count INTEGER DEFAULT 0,
    falha_count INTEGER DEFAULT 0,
    matching_info JSONB, -- Details on which bills were matched
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.logs_baixa_automatica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their write-off logs" ON public.logs_baixa_automatica FOR SELECT USING (true);

-- 5. Function to register events in receivables metadata
CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
    p_conta_id UUID,
    p_tipo TEXT,
    p_mensagem TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
    v_event JSONB;
BEGIN
    v_event := jsonb_build_object(
        'id', gen_random_uuid(),
        'type', p_tipo,
        'message', p_mensagem,
        'timestamp', now(),
        'metadata', p_metadata
    );
    
    UPDATE public.contas_receber
    SET metadata = jsonb_set(
        COALESCE(metadata, '{"events": []}'::jsonb),
        '{events}',
        (COALESCE(metadata->'events', '[]'::jsonb) || v_event)
    )
    WHERE id = p_conta_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.trigger_log_receber_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.registrar_evento_receber(NEW.id, 'criacao', 'Título criado no sistema');
    ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM public.registrar_evento_receber(
            NEW.id, 
            'status_change', 
            format('Status alterado de %s para %s', OLD.status, NEW.status),
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_receber_status
AFTER INSERT OR UPDATE OF status ON public.contas_receber
FOR EACH ROW EXECUTE FUNCTION public.trigger_log_receber_status_change();
