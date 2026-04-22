-- Tabela de assinaturas de filtros salvos
CREATE TABLE IF NOT EXISTS public.saved_filter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_filter_id UUID NOT NULL REFERENCES public.saved_filters(id) ON DELETE CASCADE,
  notify_inapp BOOLEAN NOT NULL DEFAULT true,
  notify_push BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, saved_filter_id)
);

CREATE INDEX IF NOT EXISTS idx_sfs_user ON public.saved_filter_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sfs_filter ON public.saved_filter_subscriptions(saved_filter_id);

ALTER TABLE public.saved_filter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: usuário pode "ver" o filtro salvo (mesma lógica usada em duplicate_saved_filter)
CREATE OR REPLACE FUNCTION public.can_access_saved_filter(_filter_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.saved_filters sf
    WHERE sf.id = _filter_id
      AND (
        sf.user_id = _user_id
        OR (
          sf.is_shared = true
          AND sf.empresa_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.user_empresas ue
            WHERE ue.user_id = _user_id
              AND ue.empresa_id = sf.empresa_id
              AND ue.ativo = true
              AND (
                cardinality(sf.shared_with_roles) = 0
                OR ue.role = ANY(sf.shared_with_roles)
              )
          )
        )
      )
  )
$$;

-- RLS: apenas o próprio dono manipula suas assinaturas, e o filtro precisa ser acessível
CREATE POLICY "users select own subscriptions"
  ON public.saved_filter_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own subscriptions"
  ON public.saved_filter_subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_saved_filter(saved_filter_id, auth.uid())
  );

CREATE POLICY "users update own subscriptions"
  ON public.saved_filter_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_saved_filter(saved_filter_id, auth.uid())
  );

CREATE POLICY "users delete own subscriptions"
  ON public.saved_filter_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER trg_sfs_updated_at
  BEFORE UPDATE ON public.saved_filter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime já está geralmente habilitado em anomalias_detectadas; garantir:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'anomalias_detectadas'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalias_detectadas';
  END IF;
END $$;