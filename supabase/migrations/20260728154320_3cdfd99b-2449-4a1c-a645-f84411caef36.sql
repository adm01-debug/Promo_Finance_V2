-- ============================================================
-- MOTOR TRIBUTÁRIO — Persistência de simulações, elisão, ICMS e reforma
-- ============================================================

CREATE TABLE public.simulacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  inputs JSONB NOT NULL,
  hash_inputs TEXT NOT NULL,
  resultado_simples JSONB,
  resultado_presumido JSONB,
  resultado_real JSONB,
  regime_recomendado public.regime_tributario_enum,
  economia_anual_estimada NUMERIC(15,2),
  carga_tributaria_recomendada NUMERIC(7,4),
  motivo_recomendacao TEXT,
  base_legal_decisao TEXT,
  versao_motor TEXT NOT NULL DEFAULT '3.9.0',
  tempo_execucao_ms INTEGER CHECK (tempo_execucao_ms IS NULL OR tempo_execucao_ms >= 0),
  executada_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT simulacoes_periodo_chk CHECK (periodo_fim >= periodo_inicio),
  CONSTRAINT simulacoes_carga_chk CHECK (carga_tributaria_recomendada IS NULL OR (carga_tributaria_recomendada >= 0 AND carga_tributaria_recomendada <= 2))
);
CREATE INDEX idx_sim_empresa_data ON public.simulacoes(empresa_id, created_at DESC);
CREATE INDEX idx_sim_hash ON public.simulacoes(hash_inputs);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulacoes TO authenticated;
GRANT ALL ON public.simulacoes TO service_role;
ALTER TABLE public.simulacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "simulacoes_acesso" ON public.simulacoes FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_simulacoes_updated_at BEFORE UPDATE ON public.simulacoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================

CREATE TABLE public.simulacao_tributos_detalhados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulacao_id UUID NOT NULL REFERENCES public.simulacoes(id) ON DELETE CASCADE,
  regime public.regime_tributario_enum NOT NULL,
  tributo TEXT NOT NULL,
  base_calculo NUMERIC(15,2) NOT NULL,
  aliquota NUMERIC(9,6) NOT NULL CHECK (aliquota >= 0 AND aliquota <= 1),
  valor_apurado NUMERIC(15,2) NOT NULL,
  memoria_calculo JSONB,
  base_legal TEXT NOT NULL,
  adicional NUMERIC(15,2) NOT NULL DEFAULT 0,
  fcp NUMERIC(15,2) NOT NULL DEFAULT 0,
  retencoes NUMERIC(15,2) NOT NULL DEFAULT 0,
  creditos NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sim_trib_sim ON public.simulacao_tributos_detalhados(simulacao_id);
CREATE INDEX idx_sim_trib_regime ON public.simulacao_tributos_detalhados(simulacao_id, regime);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulacao_tributos_detalhados TO authenticated;
GRANT ALL ON public.simulacao_tributos_detalhados TO service_role;
ALTER TABLE public.simulacao_tributos_detalhados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sim_trib_acesso" ON public.simulacao_tributos_detalhados FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.simulacoes s WHERE s.id = simulacao_id AND public.empresa_acessivel(s.empresa_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.simulacoes s WHERE s.id = simulacao_id AND public.empresa_acessivel(s.empresa_id)));

-- ============================================================

CREATE TABLE public.operacoes_icms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  uf_origem public.uf_brasil NOT NULL,
  uf_destino public.uf_brasil NOT NULL,
  ncm TEXT NOT NULL CHECK (ncm ~ '^[0-9]{8}$'),
  valor_operacao NUMERIC(15,2) NOT NULL CHECK (valor_operacao >= 0),
  tipo_destinatario public.tipo_destinatario NOT NULL,
  finalidade TEXT CHECK (finalidade IS NULL OR finalidade IN ('REVENDA','USO_CONSUMO','ATIVO_IMOBILIZADO','INDUSTRIALIZACAO')),
  tipo_operacao TEXT NOT NULL CHECK (tipo_operacao IN ('INTERNA','INTERESTADUAL')),
  tributos_aplicaveis JSONB NOT NULL DEFAULT '[]'::jsonb,
  tributos_nao_aplicaveis JSONB NOT NULL DEFAULT '[]'::jsonb,
  valor_total_icms NUMERIC(15,2) NOT NULL DEFAULT 0,
  icms_operacao_propria NUMERIC(15,2) NOT NULL DEFAULT 0,
  icms_st NUMERIC(15,2) NOT NULL DEFAULT 0,
  difal NUMERIC(15,2) NOT NULL DEFAULT 0,
  fcp NUMERIC(15,2) NOT NULL DEFAULT 0,
  data_operacao DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_op_icms_empresa ON public.operacoes_icms(empresa_id, data_operacao DESC);
CREATE INDEX idx_op_icms_rota ON public.operacoes_icms(uf_origem, uf_destino);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operacoes_icms TO authenticated;
GRANT ALL ON public.operacoes_icms TO service_role;
ALTER TABLE public.operacoes_icms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "operacoes_icms_acesso" ON public.operacoes_icms FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_operacoes_icms_updated_at BEFORE UPDATE ON public.operacoes_icms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================

CREATE TABLE public.oportunidades_elisao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  estrategia_codigo TEXT NOT NULL REFERENCES public.estrategias_elisao(codigo) ON UPDATE CASCADE,
  aplicavel BOOLEAN NOT NULL,
  motivo_nao_aplicavel TEXT,
  economia_anual_estimada NUMERIC(15,2),
  economia_10anos_estimada NUMERIC(15,2),
  custo_implementacao NUMERIC(15,2),
  roi_pct NUMERIC(9,2),
  payback_meses NUMERIC(7,2),
  inputs_utilizados JSONB,
  memoria_calculo TEXT,
  status public.status_workflow NOT NULL DEFAULT 'IDENTIFICADO',
  status_alterado_em TIMESTAMPTZ,
  status_alterado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_identificacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_elisao_empresa_estrategia UNIQUE (empresa_id, estrategia_codigo),
  CONSTRAINT elisao_motivo_chk CHECK (aplicavel OR motivo_nao_aplicavel IS NOT NULL)
);
CREATE INDEX idx_oport_empresa ON public.oportunidades_elisao(empresa_id, aplicavel);
CREATE INDEX idx_oport_status ON public.oportunidades_elisao(empresa_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.oportunidades_elisao TO authenticated;
GRANT ALL ON public.oportunidades_elisao TO service_role;
ALTER TABLE public.oportunidades_elisao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oportunidades_elisao_acesso" ON public.oportunidades_elisao FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_oport_elisao_updated_at BEFORE UPDATE ON public.oportunidades_elisao
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================

CREATE TABLE public.projecoes_reforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL CHECK (ano BETWEEN 2026 AND 2033),
  pis_cofins NUMERIC(15,2) NOT NULL DEFAULT 0,
  icms NUMERIC(15,2) NOT NULL DEFAULT 0,
  iss NUMERIC(15,2) NOT NULL DEFAULT 0,
  ipi NUMERIC(15,2) NOT NULL DEFAULT 0,
  cbs NUMERIC(15,2) NOT NULL DEFAULT 0,
  ibs NUMERIC(15,2) NOT NULL DEFAULT 0,
  imposto_seletivo NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_tributos NUMERIC(15,2) NOT NULL,
  carga_percentual NUMERIC(9,4) NOT NULL CHECK (carga_percentual >= 0 AND carga_percentual <= 200),
  tem_split_payment BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_proj_emp_ano UNIQUE (empresa_id, ano)
);
CREATE INDEX idx_proj_empresa ON public.projecoes_reforma(empresa_id, ano);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projecoes_reforma TO authenticated;
GRANT ALL ON public.projecoes_reforma TO service_role;
ALTER TABLE public.projecoes_reforma ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projecoes_reforma_acesso" ON public.projecoes_reforma FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_proj_reforma_updated_at BEFORE UPDATE ON public.projecoes_reforma
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();