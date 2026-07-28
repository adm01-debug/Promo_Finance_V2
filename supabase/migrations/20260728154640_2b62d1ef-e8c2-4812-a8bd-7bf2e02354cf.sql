-- ============================================================
-- ELISÃO FISCAL — alinhamento com o contrato usado pelo frontend
-- ============================================================

DROP TABLE IF EXISTS public.oportunidades_elisao CASCADE;

CREATE TABLE public.oportunidades_elisao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  estrategia TEXT NOT NULL,
  categoria TEXT,
  aplicavel BOOLEAN NOT NULL DEFAULT TRUE,
  motivo_nao_aplicavel TEXT,
  economia_estimada NUMERIC(15,2) NOT NULL DEFAULT 0,
  economia_10anos_estimada NUMERIC(15,2),
  custo_implementacao NUMERIC(15,2),
  roi_pct NUMERIC(9,2),
  payback_meses NUMERIC(7,2),
  base_legal TEXT,
  risco TEXT,
  observacoes TEXT,
  inputs_utilizados JSONB,
  memoria_calculo TEXT,
  status TEXT NOT NULL DEFAULT 'identificada'
    CHECK (status IN ('identificada','em_analise','aprovada','em_execucao','implementada','descartada')),
  status_alterado_em TIMESTAMPTZ,
  status_alterado_por UUID,
  data_identificacao DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- ===== Catálogo (view de leitura) =====
CREATE VIEW public.estrategias_elisao_catalogo
  WITH (security_invoker = true) AS
  SELECT id, codigo, nome, categoria, descricao, regimes_aplicaveis,
         economia_estimada_percentual, risco, base_legal, requisitos, ativo,
         created_at, updated_at
  FROM public.estrategias_elisao;
GRANT SELECT ON public.estrategias_elisao_catalogo TO authenticated;
GRANT SELECT ON public.estrategias_elisao_catalogo TO service_role;

-- ===== Notas fiscais processadas por OCR =====
CREATE TABLE public.notas_fiscais_ocr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  arquivo_nome TEXT,
  arquivo_url TEXT,
  chave_acesso TEXT,
  numero TEXT,
  serie TEXT,
  emitente_cnpj TEXT,
  emitente_nome TEXT,
  data_emissao DATE,
  valor_total NUMERIC(15,2),
  dados_extraidos JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processada'
    CHECK (status IN ('pendente','processando','processada','erro')),
  erro_mensagem TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_nf_ocr_empresa ON public.notas_fiscais_ocr(empresa_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_fiscais_ocr TO authenticated;
GRANT ALL ON public.notas_fiscais_ocr TO service_role;
ALTER TABLE public.notas_fiscais_ocr ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notas_fiscais_ocr_acesso" ON public.notas_fiscais_ocr FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_nf_ocr_updated_at BEFORE UPDATE ON public.notas_fiscais_ocr
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== Regras de recuperação de crédito =====
CREATE TABLE public.elisao_regras_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  tipo_credito TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ncm_prefixo TEXT,
  cst_csosn TEXT,
  aliquota NUMERIC(9,6) CHECK (aliquota IS NULL OR (aliquota >= 0 AND aliquota <= 1)),
  metodologia TEXT,
  base_legal TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.elisao_regras_creditos TO authenticated;
GRANT ALL ON public.elisao_regras_creditos TO service_role;
ALTER TABLE public.elisao_regras_creditos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regras_creditos_leitura" ON public.elisao_regras_creditos FOR SELECT TO authenticated USING (true);
CREATE POLICY "regras_creditos_admin" ON public.elisao_regras_creditos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_regras_creditos_updated_at BEFORE UPDATE ON public.elisao_regras_creditos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== Créditos auditados =====
CREATE TABLE public.elisao_creditos_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nota_id UUID REFERENCES public.notas_fiscais_ocr(id) ON DELETE SET NULL,
  regra_id UUID REFERENCES public.elisao_regras_creditos(id) ON DELETE SET NULL,
  ncm TEXT,
  cst_csosn TEXT,
  valor_base NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_credito_calculado NUMERIC(15,2) NOT NULL DEFAULT 0,
  metodologia_aplicada TEXT,
  score_confianca INTEGER CHECK (score_confianca IS NULL OR (score_confianca BETWEEN 0 AND 100)),
  divergencias_detectadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  historico_decisoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status_aprovacao TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status_aprovacao IN ('pendente','aprovado','rejeitado')),
  motivo_rejeicao TEXT,
  aprovador_id UUID,
  data_aprovacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cred_aud_empresa ON public.elisao_creditos_auditoria(empresa_id, created_at DESC);
CREATE INDEX idx_cred_aud_status ON public.elisao_creditos_auditoria(empresa_id, status_aprovacao);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elisao_creditos_auditoria TO authenticated;
GRANT ALL ON public.elisao_creditos_auditoria TO service_role;
ALTER TABLE public.elisao_creditos_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creditos_auditoria_acesso" ON public.elisao_creditos_auditoria FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_cred_aud_updated_at BEFORE UPDATE ON public.elisao_creditos_auditoria
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== Tarefas acionáveis =====
CREATE TABLE public.elisao_tarefas_acionaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo_oportunidade TEXT NOT NULL DEFAULT 'credito_tributario',
  valor_envolvido NUMERIC(15,2) NOT NULL DEFAULT 0,
  prazo DATE,
  responsavel_id UUID,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
  bitrix_task_id TEXT,
  bitrix_sync_status TEXT NOT NULL DEFAULT 'nao_sincronizado'
    CHECK (bitrix_sync_status IN ('nao_sincronizado','sincronizando','sincronizado','erro')),
  bitrix_sync_erro TEXT,
  sincronizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tarefas_elisao_empresa ON public.elisao_tarefas_acionaveis(empresa_id, prazo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elisao_tarefas_acionaveis TO authenticated;
GRANT ALL ON public.elisao_tarefas_acionaveis TO service_role;
ALTER TABLE public.elisao_tarefas_acionaveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tarefas_elisao_acesso" ON public.elisao_tarefas_acionaveis FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_tarefas_elisao_updated_at BEFORE UPDATE ON public.elisao_tarefas_acionaveis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== Alertas do módulo =====
CREATE TABLE public.elisao_alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_divergencia TEXT NOT NULL,
  severidade TEXT NOT NULL DEFAULT 'media' CHECK (severidade IN ('baixa','media','alta','critica')),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor_estimado NUMERIC(15,2),
  referencia_id UUID,
  lido BOOLEAN NOT NULL DEFAULT FALSE,
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  resolvido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_elisao_alertas_empresa ON public.elisao_alertas(empresa_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elisao_alertas TO authenticated;
GRANT ALL ON public.elisao_alertas TO service_role;
ALTER TABLE public.elisao_alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "elisao_alertas_acesso" ON public.elisao_alertas FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_elisao_alertas_updated_at BEFORE UPDATE ON public.elisao_alertas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== Simulações de regime do módulo de elisão =====
CREATE TABLE public.elisao_simulacoes_regime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  regime_atual TEXT NOT NULL,
  regime_simulado TEXT NOT NULL,
  carga_atual NUMERIC(15,2) NOT NULL DEFAULT 0,
  carga_simulada NUMERIC(15,2) NOT NULL DEFAULT 0,
  economia_estimada NUMERIC(15,2) NOT NULL DEFAULT 0,
  premissas JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_elisao_sim_empresa ON public.elisao_simulacoes_regime(empresa_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.elisao_simulacoes_regime TO authenticated;
GRANT ALL ON public.elisao_simulacoes_regime TO service_role;
ALTER TABLE public.elisao_simulacoes_regime ENABLE ROW LEVEL SECURITY;
CREATE POLICY "elisao_sim_regime_acesso" ON public.elisao_simulacoes_regime FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE TRIGGER trg_elisao_sim_updated_at BEFORE UPDATE ON public.elisao_simulacoes_regime
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== RPC: potencial de elisão consolidado =====
CREATE OR REPLACE FUNCTION public.calcular_potencial_elisao(p_empresa_id UUID)
RETURNS TABLE (
  tipo_oportunidade TEXT,
  descricao TEXT,
  valor_estimado NUMERIC,
  ncm_relacionado TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 'oportunidade_elisao'::TEXT,
         COALESCE(o.categoria, o.estrategia),
         o.economia_estimada,
         NULL::TEXT
  FROM public.oportunidades_elisao o
  WHERE o.empresa_id = p_empresa_id
    AND o.aplicavel
    AND o.status <> 'descartada'
  UNION ALL
  SELECT 'credito_tributario'::TEXT,
         COALESCE(c.metodologia_aplicada, 'Crédito identificado em auditoria'),
         c.valor_credito_calculado,
         c.ncm
  FROM public.elisao_creditos_auditoria c
  WHERE c.empresa_id = p_empresa_id
    AND c.status_aprovacao = 'aprovado';
$$;

REVOKE ALL ON FUNCTION public.calcular_potencial_elisao(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calcular_potencial_elisao(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calcular_potencial_elisao(UUID) TO service_role;