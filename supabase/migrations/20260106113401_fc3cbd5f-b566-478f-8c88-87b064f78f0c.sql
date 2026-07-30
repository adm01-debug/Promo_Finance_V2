-- ============================================
-- TABELA DE ALERTAS TRIBUTÁRIOS
-- Prazos, vencimentos e compliance
-- ============================================

CREATE TABLE public.alertas_tributarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID,
    
    -- Tipo e origem
    tipo TEXT NOT NULL CHECK (tipo IN (
        'vencimento_apuracao', 'vencimento_darf', 'vencimento_obrigacao',
        'prazo_credito', 'limite_compensacao', 'pendencia_conciliacao',
        'inconsistencia_fiscal', 'atualizacao_legislacao', 'split_payment',
        'retencao_pendente', 'nfe_rejeitada', 'saldo_negativo'
    )),
    
    -- Conteúdo
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    
    -- Prioridade
    prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
    
    -- Datas
    data_vencimento DATE,
    data_lembrete DATE,
    
    -- Referência
    entidade_tipo TEXT, -- 'apuracao', 'darf', 'credito', etc
    entidade_id UUID,
    competencia TEXT,
    
    -- Status
    lido BOOLEAN DEFAULT false,
    resolvido BOOLEAN DEFAULT false,
    resolvido_em TIMESTAMPTZ,
    resolvido_por UUID,
    
    -- Ação
    acao_url TEXT,
    acao_label TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_alertas_trib_empresa ON public.alertas_tributarios(empresa_id);
CREATE INDEX idx_alertas_trib_user ON public.alertas_tributarios(user_id);
CREATE INDEX idx_alertas_trib_tipo ON public.alertas_tributarios(tipo);
CREATE INDEX idx_alertas_trib_prioridade ON public.alertas_tributarios(prioridade);
CREATE INDEX idx_alertas_trib_vencimento ON public.alertas_tributarios(data_vencimento);
CREATE INDEX idx_alertas_trib_resolvido ON public.alertas_tributarios(resolvido);

-- RLS
ALTER TABLE public.alertas_tributarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alertas_tributarios_all" ON public.alertas_tributarios FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER set_alertas_tributarios_updated_at
    BEFORE UPDATE ON public.alertas_tributarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas_tributarios;