-- ============================================
-- MELHORIA 1: INTEGRAÇÃO NF-e → CRÉDITOS CBS/IBS
-- Apenas tabela PER/DCOMP (outras já existem)
-- ============================================

-- TABELA: PER/DCOMP (Pedidos de Restituição/Compensação)
CREATE TABLE IF NOT EXISTS public.per_dcomp (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('per', 'dcomp')),
    numero_processo TEXT,
    numero_recibo TEXT,
    data_transmissao TIMESTAMPTZ,
    tipo_credito_origem TEXT NOT NULL,
    tributo_origem TEXT NOT NULL,
    competencia_origem TEXT NOT NULL,
    valor_original NUMERIC(15,2) NOT NULL,
    valor_atualizado NUMERIC(15,2),
    tributo_destino TEXT,
    competencia_destino TEXT,
    valor_compensado NUMERIC(15,2),
    creditos_ids UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'rascunho' CHECK (status IN (
        'rascunho', 'aguardando_transmissao', 'transmitido', 
        'em_analise', 'deferido', 'indeferido', 'cancelado'
    )),
    data_protocolo DATE,
    data_decisao DATE,
    prazo_recurso DATE,
    justificativa TEXT,
    fundamentacao_legal TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_per_dcomp_empresa ON public.per_dcomp(empresa_id);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_tipo ON public.per_dcomp(tipo);
CREATE INDEX IF NOT EXISTS idx_per_dcomp_status ON public.per_dcomp(status);

ALTER TABLE public.per_dcomp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_dcomp_all" ON public.per_dcomp FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_per_dcomp_updated_at
    BEFORE UPDATE ON public.per_dcomp
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();