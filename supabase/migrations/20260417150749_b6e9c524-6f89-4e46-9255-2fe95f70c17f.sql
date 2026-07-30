-- ============================================
-- MOTOR TRIBUTÁRIO — FUNDAÇÃO (Lote 1)
-- Tabelas: faturamento_mensal, folha_pagamento,
--          regimes_simulados, oportunidades_elisao
-- ============================================

-- 1. Faturamento mensal por empresa (base para RBT12)
CREATE TABLE public.faturamento_mensal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2020 AND 2050),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  receita_bruta NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_servicos NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_revenda NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_industria NUMERIC(15,2) NOT NULL DEFAULT 0,
  receita_exportacao NUMERIC(15,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, ano, mes)
);

CREATE INDEX idx_faturamento_mensal_empresa_periodo
  ON public.faturamento_mensal(empresa_id, ano DESC, mes DESC);

ALTER TABLE public.faturamento_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view faturamento"
  ON public.faturamento_mensal FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert faturamento"
  ON public.faturamento_mensal FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Authorized roles can update faturamento"
  ON public.faturamento_mensal FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can delete faturamento"
  ON public.faturamento_mensal FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_faturamento_mensal_updated_at
  BEFORE UPDATE ON public.faturamento_mensal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Folha de pagamento mensal (base para Fator R)
CREATE TABLE public.folha_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2020 AND 2050),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  salarios NUMERIC(15,2) NOT NULL DEFAULT 0,
  pro_labore NUMERIC(15,2) NOT NULL DEFAULT 0,
  encargos NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_folha NUMERIC(15,2) NOT NULL DEFAULT 0,
  numero_funcionarios INTEGER DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, ano, mes)
);

CREATE INDEX idx_folha_pagamento_empresa_periodo
  ON public.folha_pagamento(empresa_id, ano DESC, mes DESC);

ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view folha"
  ON public.folha_pagamento FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert folha"
  ON public.folha_pagamento FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Authorized roles can update folha"
  ON public.folha_pagamento FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can delete folha"
  ON public.folha_pagamento FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_folha_pagamento_updated_at
  BEFORE UPDATE ON public.folha_pagamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Regimes simulados (histórico de simulações comparativas)
CREATE TABLE public.regimes_simulados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_simulacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  ano_referencia INTEGER NOT NULL,
  rbt12 NUMERIC(15,2) NOT NULL DEFAULT 0,
  folha_12m NUMERIC(15,2) NOT NULL DEFAULT 0,
  fator_r NUMERIC(6,4),
  regime_atual TEXT,
  regime_recomendado TEXT NOT NULL,
  cenarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  alertas JSONB NOT NULL DEFAULT '[]'::jsonb,
  justificativa TEXT,
  economia_anual_estimada NUMERIC(15,2),
  parametros JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_regimes_simulados_empresa_data
  ON public.regimes_simulados(empresa_id, data_simulacao DESC);

ALTER TABLE public.regimes_simulados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view regimes simulados"
  ON public.regimes_simulados FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert regimes simulados"
  ON public.regimes_simulados FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update regimes simulados"
  ON public.regimes_simulados FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete regimes simulados"
  ON public.regimes_simulados FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_regimes_simulados_updated_at
  BEFORE UPDATE ON public.regimes_simulados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Oportunidades de elisão fiscal
CREATE TABLE public.oportunidades_elisao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  estrategia TEXT NOT NULL,
  categoria TEXT,
  aplicavel BOOLEAN NOT NULL DEFAULT false,
  economia_estimada NUMERIC(15,2),
  base_legal TEXT,
  risco TEXT CHECK (risco IN ('baixo','medio','alto')),
  status TEXT NOT NULL DEFAULT 'identificada' CHECK (status IN ('identificada','em_analise','aprovada','implementada','descartada')),
  observacoes TEXT,
  data_identificacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_implementacao DATE,
  responsavel UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_oportunidades_elisao_empresa_status
  ON public.oportunidades_elisao(empresa_id, status, data_identificacao DESC);

ALTER TABLE public.oportunidades_elisao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized roles can view oportunidades elisao"
  ON public.oportunidades_elisao FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional','visualizador']::app_role[]));

CREATE POLICY "Authorized roles can insert oportunidades elisao"
  ON public.oportunidades_elisao FOR INSERT
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));

CREATE POLICY "Admin/financeiro can update oportunidades elisao"
  ON public.oportunidades_elisao FOR UPDATE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE POLICY "Admin/financeiro can delete oportunidades elisao"
  ON public.oportunidades_elisao FOR DELETE
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

CREATE TRIGGER update_oportunidades_elisao_updated_at
  BEFORE UPDATE ON public.oportunidades_elisao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();