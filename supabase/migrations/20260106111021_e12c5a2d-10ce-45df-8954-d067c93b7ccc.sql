-- ============================================
-- MÓDULO IRPJ/CSLL - LUCRO REAL
-- Tabelas para apuração trimestral/anual
-- ============================================

-- Tabela de Apurações IRPJ/CSLL
CREATE TABLE public.apuracoes_irpj_csll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  
  -- Período
  tipo_apuracao VARCHAR(20) NOT NULL CHECK (tipo_apuracao IN ('trimestral', 'anual', 'estimativa')),
  ano INTEGER NOT NULL,
  trimestre INTEGER CHECK (trimestre BETWEEN 1 AND 4),
  mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  
  -- Lucro Contábil
  lucro_contabil NUMERIC(15,2) DEFAULT 0,
  
  -- Adições ao Lucro Real
  adicoes_permanentes NUMERIC(15,2) DEFAULT 0,
  adicoes_temporarias NUMERIC(15,2) DEFAULT 0,
  total_adicoes NUMERIC(15,2) DEFAULT 0,
  
  -- Exclusões do Lucro Real
  exclusoes_permanentes NUMERIC(15,2) DEFAULT 0,
  exclusoes_temporarias NUMERIC(15,2) DEFAULT 0,
  total_exclusoes NUMERIC(15,2) DEFAULT 0,
  
  -- Lucro Real
  lucro_real_antes_compensacao NUMERIC(15,2) DEFAULT 0,
  compensacao_prejuizos NUMERIC(15,2) DEFAULT 0,
  lucro_real NUMERIC(15,2) DEFAULT 0,
  
  -- IRPJ
  irpj_aliquota_normal NUMERIC(6,4) DEFAULT 0.15,
  irpj_normal NUMERIC(15,2) DEFAULT 0,
  irpj_adicional_base NUMERIC(15,2) DEFAULT 0,
  irpj_adicional NUMERIC(15,2) DEFAULT 0,
  irpj_total NUMERIC(15,2) DEFAULT 0,
  
  -- CSLL
  csll_aliquota NUMERIC(6,4) DEFAULT 0.09,
  csll_base NUMERIC(15,2) DEFAULT 0,
  csll_total NUMERIC(15,2) DEFAULT 0,
  
  -- Deduções/Incentivos
  irpj_incentivos_deducoes NUMERIC(15,2) DEFAULT 0,
  
  -- Total a Pagar
  total_tributos NUMERIC(15,2) DEFAULT 0,
  
  -- Antecipações/Retenções
  irrf_retido NUMERIC(15,2) DEFAULT 0,
  csrf_retido NUMERIC(15,2) DEFAULT 0,
  saldo_negativo_anterior NUMERIC(15,2) DEFAULT 0,
  estimativas_pagas NUMERIC(15,2) DEFAULT 0,
  
  -- Saldo Final
  irpj_a_pagar NUMERIC(15,2) DEFAULT 0,
  csll_a_pagar NUMERIC(15,2) DEFAULT 0,
  saldo_negativo_irpj NUMERIC(15,2) DEFAULT 0,
  saldo_negativo_csll NUMERIC(15,2) DEFAULT 0,
  
  -- Controle
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'calculado', 'revisado', 'transmitido', 'retificado')),
  data_transmissao TIMESTAMP WITH TIME ZONE,
  numero_recibo VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX idx_apuracoes_irpj_unique ON public.apuracoes_irpj_csll(empresa_id, ano, tipo_apuracao, trimestre, mes) WHERE trimestre IS NOT NULL AND mes IS NOT NULL;
CREATE UNIQUE INDEX idx_apuracoes_irpj_trimestral ON public.apuracoes_irpj_csll(empresa_id, ano, tipo_apuracao, trimestre) WHERE tipo_apuracao = 'trimestral' AND mes IS NULL;
CREATE UNIQUE INDEX idx_apuracoes_irpj_anual ON public.apuracoes_irpj_csll(empresa_id, ano, tipo_apuracao) WHERE tipo_apuracao = 'anual' AND trimestre IS NULL AND mes IS NULL;

-- Tabela de Prejuízos Fiscais (LALUR Parte B)
CREATE TABLE public.prejuizos_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('IRPJ', 'CSLL')),
  ano_origem INTEGER NOT NULL,
  trimestre_origem INTEGER,
  valor_original NUMERIC(15,2) NOT NULL,
  valor_compensado NUMERIC(15,2) DEFAULT 0,
  saldo_disponivel NUMERIC(15,2) NOT NULL,
  data_limite_compensacao DATE,
  status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'parcial', 'compensado', 'prescrito')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Adições e Exclusões (LALUR Parte A)
CREATE TABLE public.lalur_lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  apuracao_id UUID REFERENCES public.apuracoes_irpj_csll(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('adicao', 'exclusao')),
  natureza VARCHAR(15) NOT NULL CHECK (natureza IN ('permanente', 'temporaria')),
  codigo_lancamento VARCHAR(20),
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  saldo_parte_b NUMERIC(15,2) DEFAULT 0,
  data_realizacao DATE,
  conta_contabil VARCHAR(20),
  historico TEXT,
  documento_suporte VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Incentivos Fiscais
CREATE TABLE public.incentivos_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_incentivo VARCHAR(50) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  limite_percentual NUMERIC(6,4),
  limite_valor NUMERIC(15,2),
  ano_inicio INTEGER NOT NULL,
  ano_fim INTEGER,
  valor_utilizado_ano NUMERIC(15,2) DEFAULT 0,
  numero_processo VARCHAR(50),
  ato_concessorio VARCHAR(100),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_apuracoes_irpj_empresa ON public.apuracoes_irpj_csll(empresa_id, ano);
CREATE INDEX idx_prejuizos_empresa_tipo ON public.prejuizos_fiscais(empresa_id, tipo, status);
CREATE INDEX idx_lalur_apuracao ON public.lalur_lancamentos(apuracao_id);
CREATE INDEX idx_incentivos_empresa ON public.incentivos_fiscais(empresa_id, ativo);

-- RLS
ALTER TABLE public.apuracoes_irpj_csll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prejuizos_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lalur_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentivos_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Auth users can manage apuracoes_irpj" ON public.apuracoes_irpj_csll FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage prejuizos" ON public.prejuizos_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage lalur" ON public.lalur_lancamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can manage incentivos" ON public.incentivos_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_apuracoes_irpj_updated_at BEFORE UPDATE ON public.apuracoes_irpj_csll FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prejuizos_updated_at BEFORE UPDATE ON public.prejuizos_fiscais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lalur_updated_at BEFORE UPDATE ON public.lalur_lancamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incentivos_updated_at BEFORE UPDATE ON public.incentivos_fiscais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();