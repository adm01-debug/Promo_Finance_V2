CREATE TABLE IF NOT EXISTS public.ci_security_gate_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matrix TEXT NOT NULL,
  function_name TEXT NOT NULL,
  role_tested TEXT NOT NULL,
  expected_state TEXT NOT NULL,
  observed_status INTEGER,
  observed_code TEXT,
  observed_message TEXT,
  migration_revision TEXT,
  git_sha TEXT,
  git_ref TEXT,
  workflow_run_url TEXT,
  exception_notes TEXT,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info','warning','error','critical')),
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ci_security_gate_events_function_idx
  ON public.ci_security_gate_events (function_name, role_tested, created_at DESC);
CREATE INDEX IF NOT EXISTS ci_security_gate_events_sha_idx
  ON public.ci_security_gate_events (git_sha);
CREATE INDEX IF NOT EXISTS ci_security_gate_events_created_idx
  ON public.ci_security_gate_events (created_at DESC);

GRANT SELECT ON public.ci_security_gate_events TO authenticated;
GRANT ALL ON public.ci_security_gate_events TO service_role;

ALTER TABLE public.ci_security_gate_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view CI security gate events"
  ON public.ci_security_gate_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages CI security gate events"
  ON public.ci_security_gate_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);