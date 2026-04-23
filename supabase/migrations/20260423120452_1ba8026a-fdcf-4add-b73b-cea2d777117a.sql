CREATE TABLE IF NOT EXISTS public.anomalia_toast_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anomalia_id UUID NOT NULL,
  severidade TEXT NOT NULL,
  tipo_anomalia TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  centro_custo_id UUID,
  centro_custo_nome TEXT,
  acoes_disponiveis TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  duracao_segundos INTEGER NOT NULL,
  dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_user_dispatched
  ON public.anomalia_toast_eventos (user_id, dispatched_at DESC);

CREATE INDEX IF NOT EXISTS idx_anomalia_toast_eventos_anomalia
  ON public.anomalia_toast_eventos (anomalia_id);

ALTER TABLE public.anomalia_toast_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own toast eventos"
  ON public.anomalia_toast_eventos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own toast eventos"
  ON public.anomalia_toast_eventos FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own toast eventos"
  ON public.anomalia_toast_eventos FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));