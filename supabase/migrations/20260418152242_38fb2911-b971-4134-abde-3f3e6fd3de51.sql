-- Tabela: progresso de onboarding por usuário
CREATE TABLE IF NOT EXISTS public.user_onboarding_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  etapas_completas TEXT[] NOT NULL DEFAULT '{}',
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  pulado BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seu próprio progresso"
ON public.user_onboarding_progress FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seu próprio progresso"
ON public.user_onboarding_progress FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seu próprio progresso"
ON public.user_onboarding_progress FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_onboarding_progress_updated
BEFORE UPDATE ON public.user_onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: snapshot diário de métricas SLO
CREATE TABLE IF NOT EXISTS public.slo_metrics_diarias (
  data DATE PRIMARY KEY,
  total_requisicoes INTEGER NOT NULL DEFAULT 0,
  latencia_p50_ms INTEGER NOT NULL DEFAULT 0,
  latencia_p95_ms INTEGER NOT NULL DEFAULT 0,
  latencia_p99_ms INTEGER NOT NULL DEFAULT 0,
  taxa_erro_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  uptime_pct NUMERIC(5,2) NOT NULL DEFAULT 100,
  cron_jobs_sucesso INTEGER NOT NULL DEFAULT 0,
  cron_jobs_falha INTEGER NOT NULL DEFAULT 0,
  edges_health JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.slo_metrics_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins visualizam SLO"
ON public.slo_metrics_diarias FOR SELECT
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role gerencia SLO"
ON public.slo_metrics_diarias FOR ALL
TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_slo_data_desc ON public.slo_metrics_diarias (data DESC);