-- 1. ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridade_alerta') THEN
        CREATE TYPE public.prioridade_alerta AS ENUM ('baixa', 'media', 'alta', 'critica');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_alerta_tributario') THEN
        CREATE TYPE public.tipo_alerta_tributario AS ENUM ('vencimento_apuracao', 'vencimento_darf', 'vencimento_obrigacao', 'prazo_credito', 'limite_compensacao', 'pendencia_conciliacao', 'inconsistencia_fiscal', 'atualizacao_legislacao', 'split_payment', 'retencao_pendente', 'nfe_rejeitada', 'saldo_negativo');
    END IF;
END $$;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    data_movimentacao TIMESTAMPTZ DEFAULT now(),
    valor NUMERIC NOT NULL DEFAULT 0,
    descricao TEXT,
    tipo TEXT CHECK (tipo IN ('entrada', 'saida')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alertas_tributarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    tipo public.tipo_alerta_tributario NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT,
    prioridade public.prioridade_alerta DEFAULT 'baixa',
    data_vencimento DATE,
    resolvido BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creditos_tributarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_tributo TEXT NOT NULL,
    saldo_disponivel NUMERIC NOT NULL DEFAULT 0,
    data_origem DATE NOT NULL DEFAULT CURRENT_DATE,
    competencia_origem TEXT,
    status TEXT DEFAULT 'disponivel',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.darfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo_receita TEXT NOT NULL,
    descricao_receita TEXT,
    valor_total NUMERIC NOT NULL DEFAULT 0,
    data_vencimento DATE NOT NULL,
    status TEXT DEFAULT 'gerado',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.retencoes_fonte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_imposto TEXT NOT NULL,
    valor NUMERIC NOT NULL DEFAULT 0,
    darf_gerado BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.regimes_especiais_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    regime_nome TEXT NOT NULL,
    reducao_cbs NUMERIC DEFAULT 0,
    reducao_ibs NUMERIC DEFAULT 0,
    data_inicio DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. COLUMNS
ALTER TABLE public.contas_bancarias 
ADD COLUMN IF NOT EXISTS tipo_conta TEXT DEFAULT 'corrente',
ADD COLUMN IF NOT EXISTS saldo_atual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_disponivel NUMERIC DEFAULT 0;

ALTER TABLE public.contas_pagar 
ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id);

-- 4. VIEWS
DROP VIEW IF EXISTS public.vw_dre_mensal;
CREATE VIEW public.vw_dre_mensal AS 
SELECT 
    empresa_id,
    date_trunc('month', data_movimentacao) as mes,
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as receita,
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as despesa
FROM public.movimentacoes
GROUP BY 1, 2;

DROP VIEW IF EXISTS public.vw_saldos_contas;
CREATE VIEW public.vw_saldos_contas AS
SELECT 
    id as conta_id,
    nome,
    saldo_atual,
    saldo_disponivel
FROM public.contas_bancarias;
