-- Tabela de Configurações de Regras de Duplicidade
CREATE TABLE IF NOT EXISTS public.configuracoes_duplicidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    campos_validacao TEXT[] NOT NULL DEFAULT '{fornecedor_id, valor, numero_documento, mes_vencimento}',
    tolerancia_dias INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    versao INTEGER DEFAULT 1,
    criado_por UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(empresa_id, versao)
);

ALTER TABLE public.configuracoes_duplicidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem gerenciar suas configuracoes de duplicidade"
ON public.configuracoes_duplicidade FOR ALL
USING (empresa_id IN (SELECT id FROM public.empresas WHERE ativo = true));

-- Adicionar trigger para versionamento automático (opcional, faremos via app para simplicidade inicial)

-- Função para validar duplicidade baseada nas configurações
CREATE OR REPLACE FUNCTION public.validar_duplicidade_avancada()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_conflito_id UUID;
    v_motivo TEXT;
    v_query TEXT;
    v_campo TEXT;
    v_existe BOOLEAN;
    v_campos_conflitantes JSONB := '{}'::jsonb;
BEGIN
    -- 1. Idempotency Key (Sempre validada se presente)
    IF NEW.idempotency_key IS NOT NULL THEN
        SELECT id INTO v_conflito_id FROM public.contas_pagar 
        WHERE idempotency_key = NEW.idempotency_key AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        LIMIT 1;
        
        IF v_conflito_id IS NOT NULL THEN
            v_motivo := 'Chave de idempotência duplicada (Reenvio detectado)';
            INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
            VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, jsonb_build_object('idempotency_key', NEW.idempotency_key), auth.uid());
            RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
        END IF;
    END IF;

    -- 2. Buscar configuração ativa para a empresa
    SELECT * INTO v_config FROM public.configuracoes_duplicidade 
    WHERE empresa_id = NEW.empresa_id AND ativo = true 
    ORDER BY versao DESC LIMIT 1;

    -- Se não houver config, usar padrão
    IF v_config IS NULL THEN
        -- Fallback para lógica padrão já existente no trigger anterior ou implementada aqui
        -- Para garantir perfeição, implementamos a lógica dinâmica
        v_query := 'SELECT EXISTS (SELECT 1 FROM public.contas_pagar WHERE empresa_id = $1 AND id != $2 AND status != ''cancelado''';
        
        -- Default: fornecedor, valor, documento, mes
        v_query := v_query || ' AND (fornecedor_id = $3 OR cnpj_fornecedor = $4) AND valor = $5 AND numero_documento = $6 AND date_trunc(''month'', data_vencimento) = date_trunc(''month'', $7))';
        
        EXECUTE v_query 
        INTO v_existe 
        USING NEW.empresa_id, COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid), NEW.fornecedor_id, NEW.cnpj_fornecedor, NEW.valor, NEW.numero_documento, NEW.data_vencimento;
    ELSE
        -- Lógica dinâmica baseada em v_config.campos_validacao
        v_query := 'SELECT id FROM public.contas_pagar WHERE empresa_id = $1 AND id != $2 AND status != ''cancelado''';
        
        FOREACH v_campo IN ARRAY v_config.campos_validacao LOOP
            IF v_campo = 'fornecedor_id' THEN
                v_query := v_query || ' AND (fornecedor_id = ' || quote_nullable(NEW.fornecedor_id) || ' OR cnpj_fornecedor = ' || quote_nullable(NEW.cnpj_fornecedor) || ')';
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('fornecedor', COALESCE(NEW.fornecedor_id::text, NEW.cnpj_fornecedor));
            ELSIF v_campo = 'valor' THEN
                v_query := v_query || ' AND valor = ' || NEW.valor;
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('valor', NEW.valor);
            ELSIF v_campo = 'numero_documento' THEN
                v_query := v_query || ' AND numero_documento = ' || quote_literal(NEW.numero_documento);
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('documento', NEW.numero_documento);
            ELSIF v_campo = 'mes_vencimento' THEN
                v_query := v_query || ' AND date_trunc(''month'', data_vencimento) = date_trunc(''month'', ' || quote_literal(NEW.data_vencimento) || '::date)';
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('competencia', to_char(NEW.data_vencimento, 'MM/YYYY'));
            ELSIF v_campo = 'data_vencimento' THEN
                v_query := v_query || ' AND data_vencimento = ' || quote_literal(NEW.data_vencimento);
                v_campos_conflitantes := v_campos_conflitantes || jsonb_build_object('vencimento', NEW.data_vencimento);
            END IF;
        END LOOP;

        v_query := v_query || ' LIMIT 1';
        EXECUTE v_query INTO v_conflito_id USING NEW.empresa_id, COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        v_existe := v_conflito_id IS NOT NULL;
    END IF;

    IF v_existe THEN
        v_motivo := 'Bloqueio por regra de duplicidade personalizada ativa.';
        INSERT INTO public.bloqueios_duplicidade (empresa_id, tabela, dados_tentativa, motivo_bloqueio, campos_conflitantes, usuario_id)
        VALUES (NEW.empresa_id, 'contas_pagar', to_jsonb(NEW), v_motivo, v_campos_conflitantes, auth.uid());
        
        -- Alerta Automático
        INSERT INTO public.alertas_tributarios (empresa_id, titulo, descricao, prioridade, categoria)
        VALUES (NEW.empresa_id, 'Tentativa de Pagamento Duplicado', v_motivo || ' Documento: ' || NEW.numero_documento, 'alta', 'financeiro');
        
        RAISE EXCEPTION 'DUPLICIDADE_DETECTADA: %', v_motivo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar trigger
DROP TRIGGER IF EXISTS trg_validar_duplicidade_pagar ON public.contas_pagar;
CREATE TRIGGER trg_validar_duplicidade_pagar
BEFORE INSERT OR UPDATE ON public.contas_pagar
FOR EACH ROW EXECUTE FUNCTION public.validar_duplicidade_avancada();
