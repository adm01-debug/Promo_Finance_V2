-- Tabela para registrar bloqueios de duplicidade (Auditoria)
CREATE TABLE IF NOT EXISTS public.bloqueios_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tabela TEXT NOT NULL, -- 'contas_pagar' ou 'fretes'
    dados_tentativa JSONB NOT NULL,
    motivo_bloqueio TEXT NOT NULL,
    campos_conflitantes JSONB NOT NULL,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bloqueios_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver seus bloqueios"
ON public.bloqueios_duplicidade FOR SELECT
USING (empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true));

-- Adicionar coluna de idempotência
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='idempotency_key') THEN
        ALTER TABLE public.contas_pagar ADD COLUMN idempotency_key TEXT;
        CREATE UNIQUE INDEX idx_contas_pagar_idempotency ON public.contas_pagar (idempotency_key) WHERE idempotency_key IS NOT NULL;
    END IF;
END $$;

-- Função principal de validação
CREATE OR REPLACE FUNCTION public.validar_duplicidade_financeira()
RETURNS TRIGGER AS $$
DECLARE
    v_conflito_id UUID;
    v_motivo TEXT;
BEGIN
    -- 1. Idempotency Key
    IF NEW.idempotency_key IS NOT NULL THEN
        SELECT id INTO v_conflito_id FROM public.contas_pagar 
        WHERE idempotency_key = NEW.idempotency_key AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        LIMIT 1;
        
        IF v_conflito_id IS NOT NULL THEN
            v_motivo := 'Chave de idempotência duplicada (Reenvio de API)';
            INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
            VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, jsonb_build_object('idempotency_key', NEW.idempotency_key), auth.uid());
            RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
        END IF;
    END IF;

    -- 2. Regra de Negócio: Fornecedor + Valor + Documento + Mês
    SELECT id INTO v_conflito_id FROM public.contas_pagar
    WHERE empresa_id = NEW.empresa_id
      AND (fornecedor_id = NEW.fornecedor_id OR cnpj_fornecedor = NEW.cnpj_fornecedor)
      AND valor = NEW.valor
      AND numero_documento = NEW.numero_documento
      AND date_trunc('month', data_vencimento) = date_trunc('month', NEW.data_vencimento)
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status != 'cancelado'
    LIMIT 1;

    IF v_conflito_id IS NOT NULL THEN
        v_motivo := 'Pagamento idêntico detectado para o mesmo fornecedor/CNPJ, valor e documento no mês.';
        INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
        VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, 
                jsonb_build_object('fornecedor', COALESCE(NEW.fornecedor_id::text, NEW.cnpj_fornecedor), 'valor', NEW.valor, 'documento', NEW.numero_documento), 
                auth.uid());
        
        -- Alerta Automático
        INSERT INTO public.alertas_tributarios (empresa_id, titulo, descricao, prioridade, categoria)
        VALUES (NEW.empresa_id, 'Bloqueio de Duplicidade', v_motivo || ' Documento: ' || NEW.numero_documento, 'alta', 'financeiro');
        
        RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagar ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagar
BEFORE INSERT OR UPDATE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.validar_duplicidade_financeira();
