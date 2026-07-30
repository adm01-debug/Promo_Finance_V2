CREATE TABLE public.anomalia_detection_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_by UUID,
  trigger_source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'queued',
  current_step TEXT,
  step_index INT NOT NULL DEFAULT 0,
  total_steps INT NOT NULL DEFAULT 5,
  candidatas INT NOT NULL DEFAULT 0,
  inseridas INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_anomalia_runs_status ON public.anomalia_detection_runs(status, created_at DESC);
CREATE INDEX idx_anomalia_runs_created ON public.anomalia_detection_runs(created_at DESC);

ALTER TABLE public.anomalia_detection_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar execuções de detecção"
ON public.anomalia_detection_runs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar execuções de detecção"
ON public.anomalia_detection_runs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar execuções de detecção"
ON public.anomalia_detection_runs FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalia_detection_runs;
ALTER TABLE public.anomalia_detection_runs REPLICA IDENTITY FULL;