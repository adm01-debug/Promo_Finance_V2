-- Tabela para log de tentativas de duplicidade e hashes de transação
CREATE TABLE IF NOT EXISTS public.registro_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash_identificador TEXT NOT NULL, -- md5(fornecedor_id + valor + data_vencimento + empresa_id)
    entidade_id UUID, -- ID da conta_pagar original ou nova
    tipo_entidade TEXT DEFAULT 'conta_pagar',
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index para busca rápida de hash
CREATE INDEX IF NOT EXISTS idx_registro_duplicidade_hash ON public.registro_duplicidade(hash_identificador);

-- Função para gerar hash de duplicidade
CREATE OR REPLACE FUNCTION public.gerar_hash_pagamento(
    p_fornecedor_id UUID,
    p_valor NUMERIC,
    p_data_vencimento DATE,
    p_empresa_id UUID,
    p_numero_documento TEXT DEFAULT NULL,
    p_codigo_barras TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
    -- Se tiver código de barras, ele é o identificador soberano
    IF p_codigo_barras IS NOT NULL AND p_codigo_barras <> '' THEN
        RETURN md5('barcode-' || p_codigo_barras);
    END IF;
    
    -- Caso contrário, combinação de dados críticos
    RETURN md5(
        COALESCE(p_fornecedor_id::text, 'no-vendor') || 
        p_valor::text || 
        p_data_vencimento::text || 
        p_empresa_id::text || 
        COALESCE(p_numero_documento, '')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para validar duplicidade antes do insert em contas_pagar
CREATE OR REPLACE FUNCTION public.validar_duplicidade_pagamento()
RETURNS TRIGGER AS $$
DECLARE
    v_hash TEXT;
    v_existe BOOLEAN;
    v_msg TEXT;
BEGIN
    -- Ignorar se for recorrente ou se tiver flag de bypass (a ser implementada se necessário)
    IF NEW.recorrente = true THEN
        RETURN NEW;
    END IF;

    -- Gerar hash para a nova tentativa
    v_hash := public.gerar_hash_pagamento(
        NEW.fornecedor_id,
        NEW.valor,
        NEW.data_vencimento,
        NEW.empresa_id,
        NEW.numero_documento,
        NEW.codigo_barras
    );

    -- Verificar se existe registro idêntico nos últimos 24 meses (evitar lixo histórico)
    SELECT EXISTS (
        SELECT 1 FROM public.contas_pagar 
        WHERE id <> NEW.id -- Evitar self-match no update
        AND status <> 'cancelado'
        AND public.gerar_hash_pagamento(fornecedor_id, valor, data_vencimento, empresa_id, numero_documento, codigo_barras) = v_hash
        AND created_at > now() - interval '24 months'
    ) INTO v_existe;

    IF v_existe THEN
        v_msg := 'ALERTA DE DUPLICIDADE: Já existe um lançamento idêntico (Fornecedor, Valor e Vencimento) cadastrado no sistema.';
        RAISE EXCEPTION '%', v_msg USING ERRCODE = 'unique_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela contas_pagar
DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagamento ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagamento
BEFORE INSERT OR UPDATE OF fornecedor_id, valor, data_vencimento, numero_documento, codigo_barras
ON public.contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.validar_duplicidade_pagamento();

-- Comentários de segurança e governança
COMMENT ON TABLE public.registro_duplicidade IS 'Log de auditoria para tentativas de inserção de pagamentos duplicados e rastreio de integridade.';
COMMENT ON FUNCTION public.validar_duplicidade_pagamento IS 'Regra de negócio rígida para impedir pagamentos duplicados de fornecedores e fretes.';
