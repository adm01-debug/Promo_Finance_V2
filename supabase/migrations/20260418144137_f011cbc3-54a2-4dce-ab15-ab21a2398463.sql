-- ============= ENUMS =============
CREATE TYPE public.tipo_solicitacao_lgpd AS ENUM ('acesso', 'portabilidade', 'exclusao', 'retificacao', 'anonimizacao');
CREATE TYPE public.status_solicitacao_lgpd AS ENUM ('aberta', 'em_analise', 'atendida', 'rejeitada');
CREATE TYPE public.tipo_anomalia AS ENUM ('movimentacao_outlier', 'pagamento_duplicado', 'conta_pagar_alta', 'conciliacao_atrasada', 'mudanca_regime_brusca');
CREATE TYPE public.severidade_anomalia AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.status_anomalia AS ENUM ('nova', 'investigando', 'falso_positivo', 'confirmada');

-- ============= 1. SOLICITAÇÕES LGPD =============
CREATE TABLE public.solicitacoes_lgpd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  tipo public.tipo_solicitacao_lgpd NOT NULL,
  status public.status_solicitacao_lgpd NOT NULL DEFAULT 'aberta',
  justificativa TEXT,
  payload_resposta JSONB,
  url_dump TEXT,
  atendida_em TIMESTAMPTZ,
  atendida_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_lgpd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias solicitações"
  ON public.solicitacoes_lgpd FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários criam suas próprias solicitações"
  ON public.solicitacoes_lgpd FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Apenas admin atualiza solicitações"
  ON public.solicitacoes_lgpd FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_solicitacoes_lgpd_updated_at
  BEFORE UPDATE ON public.solicitacoes_lgpd
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_solicitacoes_lgpd_user ON public.solicitacoes_lgpd(user_id, created_at DESC);
CREATE INDEX idx_solicitacoes_lgpd_status ON public.solicitacoes_lgpd(status, created_at DESC);

-- ============= 2. HEALTH SCORES =============
CREATE TABLE public.health_scores_operacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  snapshot_data DATE NOT NULL DEFAULT CURRENT_DATE,
  score_total NUMERIC(5,2) NOT NULL,
  score_tributario NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_financeiro NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_operacional NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_lgpd NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_cadastros NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_engajamento NUMERIC(5,2) NOT NULL DEFAULT 0,
  tendencia_pct NUMERIC(6,2),
  insights_md TEXT,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_scores_operacionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin visualiza health scores"
  ON public.health_scores_operacionais FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere health scores via service role"
  ON public.health_scores_operacionais FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_health_scores_empresa_data ON public.health_scores_operacionais(empresa_id, snapshot_data DESC);
CREATE UNIQUE INDEX idx_health_scores_unique ON public.health_scores_operacionais(empresa_id, snapshot_data) WHERE empresa_id IS NOT NULL;

-- ============= 3. ANOMALIAS DETECTADAS =============
CREATE TABLE public.anomalias_detectadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID,
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID,
  tipo_anomalia public.tipo_anomalia NOT NULL,
  severidade public.severidade_anomalia NOT NULL DEFAULT 'media',
  descricao TEXT NOT NULL,
  dados JSONB,
  status public.status_anomalia NOT NULL DEFAULT 'nova',
  detectada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvida_em TIMESTAMPTZ,
  resolvida_por UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.anomalias_detectadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admin visualiza anomalias"
  ON public.anomalias_detectadas FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admin atualiza anomalias"
  ON public.anomalias_detectadas FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sistema insere anomalias"
  ON public.anomalias_detectadas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_anomalias_updated_at
  BEFORE UPDATE ON public.anomalias_detectadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_anomalias_status ON public.anomalias_detectadas(status, detectada_em DESC);
CREATE INDEX idx_anomalias_empresa ON public.anomalias_detectadas(empresa_id, detectada_em DESC);
CREATE INDEX idx_anomalias_severidade ON public.anomalias_detectadas(severidade, status);