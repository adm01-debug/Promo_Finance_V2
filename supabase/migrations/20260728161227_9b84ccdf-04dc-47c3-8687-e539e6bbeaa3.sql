-- Gap #8: Observabilidade e notificações
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  event text,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('debug','info','warn','error')),
  error_message text,
  duration_ms integer,
  status_code integer,
  user_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.edge_function_logs TO authenticated;
GRANT ALL ON public.edge_function_logs TO service_role;
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "edge_function_logs_admin_select" ON public.edge_function_logs;
CREATE POLICY "edge_function_logs_admin_select" ON public.edge_function_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_edge_logs_created ON public.edge_function_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_logs_level ON public.edge_function_logs (level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_logs_function ON public.edge_function_logs (function_name, created_at DESC);

CREATE TABLE IF NOT EXISTS public.slo_metrics_diarias (
  data date PRIMARY KEY,
  total_requisicoes bigint NOT NULL DEFAULT 0,
  latencia_p50_ms numeric NOT NULL DEFAULT 0,
  latencia_p95_ms numeric NOT NULL DEFAULT 0,
  latencia_p99_ms numeric NOT NULL DEFAULT 0,
  taxa_erro_pct numeric NOT NULL DEFAULT 0 CHECK (taxa_erro_pct >= 0 AND taxa_erro_pct <= 100),
  uptime_pct numeric NOT NULL DEFAULT 100 CHECK (uptime_pct >= 0 AND uptime_pct <= 100),
  cron_jobs_sucesso integer NOT NULL DEFAULT 0,
  cron_jobs_falha integer NOT NULL DEFAULT 0,
  edges_health jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.slo_metrics_diarias TO authenticated;
GRANT ALL ON public.slo_metrics_diarias TO service_role;
ALTER TABLE public.slo_metrics_diarias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "slo_metrics_admin_select" ON public.slo_metrics_diarias;
CREATE POLICY "slo_metrics_admin_select" ON public.slo_metrics_diarias
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.planos_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','critica')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluido','cancelado')),
  prazo date,
  responsavel text,
  progresso integer NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos_acao TO authenticated;
GRANT ALL ON public.planos_acao TO service_role;
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "planos_acao_owner" ON public.planos_acao;
CREATE POLICY "planos_acao_owner" ON public.planos_acao
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_planos_acao_user ON public.planos_acao (user_id, status);
DROP TRIGGER IF EXISTS trg_planos_acao_updated_at ON public.planos_acao;
CREATE TRIGGER trg_planos_acao_updated_at BEFORE UPDATE ON public.planos_acao
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.kpis_operacionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  valor_atual numeric NOT NULL DEFAULT 0,
  meta numeric NOT NULL DEFAULT 0,
  unidade text,
  tendencia text CHECK (tendencia IN ('subindo','descendo','estavel')),
  categoria text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kpis_operacionais_unique UNIQUE (user_id, nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpis_operacionais TO authenticated;
GRANT ALL ON public.kpis_operacionais TO service_role;
ALTER TABLE public.kpis_operacionais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kpis_operacionais_owner" ON public.kpis_operacionais;
CREATE POLICY "kpis_operacionais_owner" ON public.kpis_operacionais
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP TRIGGER IF EXISTS trg_kpis_operacionais_updated_at ON public.kpis_operacionais;
CREATE TRIGGER trg_kpis_operacionais_updated_at BEFORE UPDATE ON public.kpis_operacionais
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  channel text NOT NULL DEFAULT 'inapp' CHECK (channel IN ('inapp','push','email')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','queued')),
  error_message text,
  metadata jsonb,
  source_ref text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_history TO authenticated;
GRANT ALL ON public.notification_history TO service_role;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_history_owner" ON public.notification_history;
CREATE POLICY "notification_history_owner" ON public.notification_history
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON public.notification_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_unread ON public.notification_history (user_id) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL DEFAULT '',
  auth text NOT NULL DEFAULT '',
  user_agent text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_unique UNIQUE (user_id, endpoint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_owner" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_owner" ON public.push_subscriptions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP TRIGGER IF EXISTS trg_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();