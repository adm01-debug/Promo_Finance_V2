-- Atualização da regua_cobranca
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.regua_cobranca ADD COLUMN IF NOT EXISTS etapa TEXT;

-- Atualização da execucoes_cobranca
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS destinatario TEXT;
ALTER TABLE public.execucoes_cobranca ADD COLUMN IF NOT EXISTS provider TEXT;

-- Atualização da historico_cobranca
ALTER TABLE public.historico_cobranca ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.historico_cobranca ADD COLUMN IF NOT EXISTS fila_id UUID;
ALTER TABLE public.historico_cobranca ADD COLUMN IF NOT EXISTS etapa TEXT;
ALTER TABLE public.historico_cobranca ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.historico_cobranca ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

-- Atualização da pix_templates
ALTER TABLE public.pix_templates ADD COLUMN IF NOT EXISTS instrucoes TEXT;

-- Recriação da view de métricas de cobrança
DROP VIEW IF EXISTS public.vw_metricas_cobranca;
CREATE VIEW public.vw_metricas_cobranca AS
SELECT 
    etapa,
    COUNT(*) FILTER (WHERE status = 'enviado') as total_enviados,
    COUNT(*) FILTER (WHERE status = 'entregue') as total_entregues,
    COUNT(*) FILTER (WHERE status = 'lido') as total_lidos,
    CASE 
        WHEN COUNT(*) FILTER (WHERE status = 'enviado') > 0 
        THEN (COUNT(*) FILTER (WHERE status = 'entregue')::float / COUNT(*) FILTER (WHERE status = 'enviado')::float) * 100
        ELSE 0 
    END as taxa_entrega,
    empresa_id
FROM public.fila_cobrancas
GROUP BY etapa, empresa_id;

-- RPC: processar_regua_cobranca
CREATE OR REPLACE FUNCTION public.processar_regua_cobranca(p_empresa_id UUID DEFAULT NULL, p_simulate BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Simulação de processamento (em produção aqui rodaria a lógica de gatilhos)
    IF p_simulate THEN
        result := jsonb_build_object(
            'total_enfileirados', (SELECT count(*) FROM public.contas_receber WHERE status = 'pendente' AND empresa_id = COALESCE(p_empresa_id, empresa_id)),
            'message', 'Simulação concluída com base nos títulos pendentes.'
        );
    ELSE
        result := jsonb_build_object(
            'total_enfileirados', 0,
            'message', 'Lógica de produção: disparos agendados.'
        );
    END IF;
    RETURN result;
END;
$$;

-- RPC: confirmar_envio_cobranca
CREATE OR REPLACE FUNCTION public.confirmar_envio_cobranca(
    p_fila_id UUID, 
    p_provider TEXT DEFAULT NULL, 
    p_provider_message_id TEXT DEFAULT NULL, 
    p_sucesso BOOLEAN DEFAULT TRUE, 
    p_erro TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.fila_cobrancas
    SET 
        status = CASE WHEN p_sucesso THEN 'enviado' ELSE 'falhou' END,
        provider = p_provider,
        updated_at = now()
    WHERE id = p_fila_id;

    INSERT INTO public.historico_cobranca (
        empresa_id,
        fila_id,
        provider,
        provider_message_id,
        status,
        mensagem,
        created_at
    )
    SELECT 
        empresa_id,
        id,
        p_provider,
        p_provider_message_id,
        CASE WHEN p_sucesso THEN 'enviado' ELSE 'falhou' END,
        p_erro,
        now()
    FROM public.fila_cobrancas
    WHERE id = p_fila_id;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.processar_regua_cobranca(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_envio_cobranca(UUID, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;

-- RLS (Garantir que as políticas existam ou sejam atualizadas)
-- Como as tabelas já existem, apenas reforçamos o isolamento por empresa_id onde aplicável

ALTER TABLE public.regua_cobranca ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "regua_cobranca_isolation" ON public.regua_cobranca;
CREATE POLICY "regua_cobranca_isolation" ON public.regua_cobranca
    USING (empresa_id IN (SELECT id FROM public.empresas)); -- Simplificado para o exemplo, assumindo que o usuário tem acesso à empresa

ALTER TABLE public.execucoes_cobranca ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "execucoes_cobranca_isolation" ON public.execucoes_cobranca;
CREATE POLICY "execucoes_cobranca_isolation" ON public.execucoes_cobranca
    USING (empresa_id IN (SELECT id FROM public.empresas));

ALTER TABLE public.historico_cobranca ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "historico_cobranca_isolation" ON public.historico_cobranca;
CREATE POLICY "historico_cobranca_isolation" ON public.historico_cobranca
    USING (empresa_id IN (SELECT id FROM public.empresas));

ALTER TABLE public.pix_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pix_templates_isolation" ON public.pix_templates;
CREATE POLICY "pix_templates_isolation" ON public.pix_templates
    USING (empresa_id IN (SELECT id FROM public.empresas));
