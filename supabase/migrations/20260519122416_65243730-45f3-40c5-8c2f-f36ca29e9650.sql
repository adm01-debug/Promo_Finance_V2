-- 1. Fix boletos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'empresa_id') THEN
        ALTER TABLE public.boletos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'updated_at') THEN
        ALTER TABLE public.boletos ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- 2. Create RPC: registrar_evento_receber
CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
    p_conta_id UUID,
    p_tipo TEXT,
    p_mensagem TEXT,
    p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.historico_cobranca (
        conta_receber_id,
        tipo_evento,
        descricao,
        metadados,
        created_at
    ) VALUES (
        p_conta_id,
        p_tipo,
        p_mensagem,
        p_metadata,
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create RPC: registrar_evento_pagar
CREATE OR REPLACE FUNCTION public.registrar_evento_pagar(
    p_conta_id UUID,
    p_tipo TEXT,
    p_mensagem TEXT,
    p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
BEGIN
    -- This assumes a similar table exists or logs to audit_logs
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        details,
        created_at
    ) VALUES (
        'contas_pagar',
        p_conta_id,
        p_tipo,
        p_mensagem || ' ' || p_metadata::text,
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create RPC: confirmar_conciliacao
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao(
    p_conciliacao_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE public.conciliacoes
    SET status = 'confirmado',
        confirmado_por = p_user_id,
        confirmado_em = now(),
        updated_at = now()
    WHERE id = p_conciliacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create RPC: desfazer_conciliacao
CREATE OR REPLACE FUNCTION public.desfazer_conciliacao(
    p_conciliacao_id UUID
) RETURNS VOID AS $$
BEGIN
    DELETE FROM public.conciliacoes
    WHERE id = p_conciliacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
