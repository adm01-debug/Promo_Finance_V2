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

-- Reconciliacao com o banco de PRODUCAO, no arquivo que CRIA a tabela.
--
-- Estas colunas existem no canonico bwwbeyolnnzppeuhgkcd e a cadeia nunca as
-- criava. O numero veio de replay real (Postgres 16.15, os 1025 arquivos em
-- ordem, 1 transacao por arquivo): a secao 4 de 20261116190000 imprimia
--   NOTICE: indices de FK: 109 aplicados, 17 ignorados por coluna ou tabela ausente
-- e 4 arquivos abortavam por coluna ausente.
--
-- A coluna entra AQUI, e nao num arquivo de timestamp novo, porque medi que um
-- arquivo no fim da cadeia nao resolve: com a migration 20261116220000
-- aplicada, os 126 nomes de indice presentes no replay seguiam 106, iguais a
-- sem ela, porque ela roda DEPOIS de quem precisa da coluna. Mesmo padrao do
-- indice da FK em 20260712223141.
--
-- Em producao e no-op: este arquivo ja foi aplicado, e migration-ledger.yml
-- compara versao (nome do arquivo), nao checksum de conteudo.
--
-- Para asaas_audit_trail.asaas_payment_id, asaas_sync_queue.asaas_payment_id e
-- fila_cobrancas.etapa_id esta e uma ADICAO, nao renomeacao: em producao a
-- coluna antiga nao existe mais, mas 18 arquivos da cadeia ainda a usam (o
-- ultimo em 20261102000000), e renomear aqui quebra 20260508183450 e
-- 20260508184054 — medido. A remocao da coluna antiga e outra tarefa.

ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS user_id uuid;
DO $fk$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='anomalias_detectadas_user_id_fkey'
                   AND conrelid='public.anomalias_detectadas'::regclass)
     AND EXISTS (SELECT 1 FROM pg_class cl JOIN pg_namespace ns ON ns.oid=cl.relnamespace
                  WHERE ns.nspname='auth' AND cl.relname='users'
                    AND cl.relkind='r') THEN
    ALTER TABLE public.anomalias_detectadas ADD CONSTRAINT anomalias_detectadas_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END
$fk$;
