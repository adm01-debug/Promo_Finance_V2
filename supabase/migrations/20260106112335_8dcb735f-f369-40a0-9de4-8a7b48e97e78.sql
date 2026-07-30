-- ============================================
-- FUNÇÃO UPDATE_UPDATED_AT (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABELA DE RETENÇÕES NA FONTE
-- ============================================
CREATE TABLE public.retencoes_fonte (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_retencao TEXT NOT NULL CHECK (tipo_retencao IN (
        'irrf', 'csrf', 'pis_cofins_csll', 'inss', 'iss', 'cbs', 'ibs'
    )),
    tipo_operacao TEXT NOT NULL CHECK (tipo_operacao IN ('pagamento', 'recebimento')),
    nota_fiscal_id UUID,
    conta_pagar_id UUID,
    conta_receber_id UUID,
    cnpj_participante TEXT,
    nome_participante TEXT NOT NULL,
    valor_base NUMERIC(15,2) NOT NULL,
    aliquota NUMERIC(5,4) NOT NULL,
    valor_retido NUMERIC(15,2) NOT NULL,
    data_fato_gerador DATE NOT NULL,
    data_retencao DATE NOT NULL,
    data_recolhimento DATE,
    data_vencimento DATE NOT NULL,
    codigo_receita TEXT,
    numero_documento TEXT,
    darf_gerado BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'recolhido', 'compensado', 'cancelado')),
    competencia TEXT NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE INDEX idx_retencoes_fonte_empresa ON public.retencoes_fonte(empresa_id);
CREATE INDEX idx_retencoes_fonte_comp ON public.retencoes_fonte(competencia);
CREATE INDEX idx_retencoes_fonte_tipo ON public.retencoes_fonte(tipo_retencao);
CREATE INDEX idx_retencoes_fonte_status ON public.retencoes_fonte(status);

ALTER TABLE public.retencoes_fonte ENABLE ROW LEVEL SECURITY;
CREATE POLICY "retencoes_fonte_all" ON public.retencoes_fonte FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_retencoes_updated_at
    BEFORE UPDATE ON public.retencoes_fonte
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- TABELA DARFS
-- ============================================
CREATE TABLE public.darfs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo_receita TEXT NOT NULL,
    descricao_receita TEXT NOT NULL,
    competencia TEXT NOT NULL,
    valor_principal NUMERIC(15,2) NOT NULL,
    valor_multa NUMERIC(15,2) DEFAULT 0,
    valor_juros NUMERIC(15,2) DEFAULT 0,
    valor_total NUMERIC(15,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    codigo_barras TEXT,
    linha_digitavel TEXT,
    status TEXT DEFAULT 'gerado' CHECK (status IN ('gerado', 'pago', 'vencido', 'cancelado')),
    retencoes_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE INDEX idx_darfs_empresa ON public.darfs(empresa_id);
CREATE INDEX idx_darfs_competencia ON public.darfs(competencia);
CREATE INDEX idx_darfs_status ON public.darfs(status);

ALTER TABLE public.darfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "darfs_all" ON public.darfs FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_darfs_updated_at
    BEFORE UPDATE ON public.darfs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();