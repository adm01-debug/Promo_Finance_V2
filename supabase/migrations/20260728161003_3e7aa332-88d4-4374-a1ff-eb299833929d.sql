-- Gap #6: Módulo de Segurança e LGPD
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  title text NOT NULL,
  description text,
  ip_address text,
  user_id uuid,
  user_email text,
  metadata jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_alerts_admin_all" ON public.security_alerts;
CREATE POLICY "security_alerts_admin_all" ON public.security_alerts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts (resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts (type);

CREATE TABLE IF NOT EXISTS public.solicitacoes_lgpd (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('acesso','portabilidade','exclusao','retificacao','anonimizacao')),
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_analise','atendida','rejeitada')),
  justificativa text,
  payload_resposta jsonb,
  url_dump text,
  atendida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_lgpd TO authenticated;
GRANT ALL ON public.solicitacoes_lgpd TO service_role;
ALTER TABLE public.solicitacoes_lgpd ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lgpd_owner_select" ON public.solicitacoes_lgpd;
CREATE POLICY "lgpd_owner_select" ON public.solicitacoes_lgpd
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "lgpd_owner_insert" ON public.solicitacoes_lgpd;
CREATE POLICY "lgpd_owner_insert" ON public.solicitacoes_lgpd
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lgpd_admin_update" ON public.solicitacoes_lgpd;
CREATE POLICY "lgpd_admin_update" ON public.solicitacoes_lgpd
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_user ON public.solicitacoes_lgpd (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_lgpd_status ON public.solicitacoes_lgpd (status);

DROP TRIGGER IF EXISTS trg_solicitacoes_lgpd_updated_at ON public.solicitacoes_lgpd;
CREATE TRIGGER trg_solicitacoes_lgpd_updated_at
  BEFORE UPDATE ON public.solicitacoes_lgpd
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();