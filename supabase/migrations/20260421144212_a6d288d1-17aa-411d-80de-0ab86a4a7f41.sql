-- 1. Preferências de alerta de anomalias por usuário
CREATE TABLE public.user_anomalia_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  toast_enabled BOOLEAN NOT NULL DEFAULT true,
  toast_min_severidade TEXT NOT NULL DEFAULT 'critica' CHECK (toast_min_severidade IN ('baixa','media','alta','critica')),
  silenciar_ate TIMESTAMPTZ,
  centros_custo_silenciados UUID[] NOT NULL DEFAULT '{}',
  tipos_silenciados TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_anomalia_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own anomalia prefs"
  ON public.user_anomalia_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own anomalia prefs"
  ON public.user_anomalia_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own anomalia prefs"
  ON public.user_anomalia_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users delete own anomalia prefs"
  ON public.user_anomalia_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_anomalia_prefs_updated
  BEFORE UPDATE ON public.user_anomalia_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Vincular anomalias a centro de custo (nullable)
ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS centro_custo_id UUID;

CREATE INDEX IF NOT EXISTS idx_anomalias_centro_custo
  ON public.anomalias_detectadas(centro_custo_id)
  WHERE centro_custo_id IS NOT NULL;

-- 3. Backfill best-effort
UPDATE public.anomalias_detectadas a
SET centro_custo_id = cp.centro_custo_id
FROM public.contas_pagar cp
WHERE a.entidade_tipo = 'conta_pagar'
  AND a.centro_custo_id IS NULL
  AND a.entidade_id IS NOT NULL
  AND a.entidade_id::uuid = cp.id
  AND cp.centro_custo_id IS NOT NULL;

UPDATE public.anomalias_detectadas a
SET centro_custo_id = m.centro_custo_id
FROM public.movimentacoes m
WHERE a.entidade_tipo = 'movimentacao'
  AND a.centro_custo_id IS NULL
  AND a.entidade_id IS NOT NULL
  AND a.entidade_id::uuid = m.id
  AND m.centro_custo_id IS NOT NULL;