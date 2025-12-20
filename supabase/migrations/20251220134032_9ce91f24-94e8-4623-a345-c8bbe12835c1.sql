-- Tabela para histórico de análises preditivas
CREATE TABLE IF NOT EXISTS public.historico_analises_preditivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_saude_financeira INTEGER NOT NULL,
  resumo_executivo TEXT,
  analise_completa JSONB NOT NULL,
  dados_analisados JSONB,
  projecoes JSONB,
  alertas_gerados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para histórico do score de saúde financeira
CREATE TABLE IF NOT EXISTS public.historico_score_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  indicadores JSONB,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para alertas preditivos persistentes
CREATE TABLE IF NOT EXISTS public.alertas_preditivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('ruptura', 'inadimplencia_provavel', 'oportunidade_antecipacao', 'concentracao_risco', 'meta_risco', 'tendencia_negativa')),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  probabilidade INTEGER CHECK (probabilidade >= 0 AND probabilidade <= 100),
  impacto_estimado NUMERIC(15, 2),
  data_previsao DATE,
  sugestoes JSONB,
  prioridade TEXT NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'resolvido', 'ignorado')),
  resolvido_em TIMESTAMP WITH TIME ZONE,
  resolvido_por UUID REFERENCES auth.users(id),
  analise_preditiva_id UUID REFERENCES public.historico_analises_preditivas(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para recomendações de metas baseadas em IA
CREATE TABLE IF NOT EXISTS public.recomendacoes_metas_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_meta TEXT NOT NULL,
  valor_sugerido NUMERIC(15, 2) NOT NULL,
  justificativa TEXT NOT NULL,
  baseado_em JSONB,
  confianca INTEGER CHECK (confianca >= 0 AND confianca <= 100),
  periodo_referencia_inicio DATE,
  periodo_referencia_fim DATE,
  aceita BOOLEAN,
  meta_id UUID REFERENCES public.metas_financeiras(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_analises_created_at ON public.historico_analises_preditivas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_score_created_at ON public.historico_score_saude(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_preditivos_status ON public.alertas_preditivos(status, prioridade);
CREATE INDEX IF NOT EXISTS idx_alertas_preditivos_user ON public.alertas_preditivos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recomendacoes_metas_tipo ON public.recomendacoes_metas_ia(tipo_meta, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.historico_analises_preditivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_score_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_preditivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recomendacoes_metas_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - histórico de análises (todos autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver histórico de análises"
ON public.historico_analises_preditivas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode inserir análises"
ON public.historico_analises_preditivas FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas RLS - histórico score (todos autenticados podem ver)
CREATE POLICY "Usuários autenticados podem ver histórico de score"
ON public.historico_score_saude FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode inserir scores"
ON public.historico_score_saude FOR INSERT
TO authenticated
WITH CHECK (true);

-- Políticas RLS - alertas preditivos
CREATE POLICY "Usuários podem ver seus alertas preditivos"
ON public.alertas_preditivos FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Sistema pode inserir alertas preditivos"
ON public.alertas_preditivos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar seus alertas"
ON public.alertas_preditivos FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- Políticas RLS - recomendações de metas
CREATE POLICY "Usuários autenticados podem ver recomendações"
ON public.recomendacoes_metas_ia FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Sistema pode inserir recomendações"
ON public.recomendacoes_metas_ia FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar recomendações"
ON public.recomendacoes_metas_ia FOR UPDATE
TO authenticated
USING (true);