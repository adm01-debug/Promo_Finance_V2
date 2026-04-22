
CREATE TABLE public.sso_sandbox_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text,
  provider_id uuid REFERENCES public.sso_providers(id) ON DELETE SET NULL,
  provider_nome text,
  use_provider_config boolean NOT NULL DEFAULT true,
  input jsonb NOT NULL,
  result jsonb NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('bloqueado','seria_jit','usuario_existente','sem_email')),
  email_masked text,
  resolved_role text,
  matched_group text,
  has_errors boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_sso_sandbox_runs_created_at ON public.sso_sandbox_runs (created_at DESC);
CREATE INDEX idx_sso_sandbox_runs_provider ON public.sso_sandbox_runs (provider_id, created_at DESC);
CREATE INDEX idx_sso_sandbox_runs_outcome ON public.sso_sandbox_runs (outcome, created_at DESC);

ALTER TABLE public.sso_sandbox_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read sandbox runs"
  ON public.sso_sandbox_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert sandbox runs"
  ON public.sso_sandbox_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Admins delete sandbox runs"
  ON public.sso_sandbox_runs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
