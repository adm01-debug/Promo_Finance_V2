-- Gap #7: Persistência de filtros
CREATE TABLE IF NOT EXISTS public.saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_by uuid,
  entity_type text NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_shared boolean NOT NULL DEFAULT false,
  empresa_id uuid,
  shared_with_roles text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_filters_unique UNIQUE (user_id, entity_type, name),
  CONSTRAINT saved_filters_shared_requires_empresa CHECK (NOT is_shared OR empresa_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_filters TO authenticated;
GRANT ALL ON public.saved_filters TO service_role;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_filters_select" ON public.saved_filters;
CREATE POLICY "saved_filters_select" ON public.saved_filters
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      is_shared
      AND empresa_id IS NOT NULL
      AND public.empresa_acessivel(empresa_id)
      AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role::text = ANY (saved_filters.shared_with_roles)
      )
    )
  );

DROP POLICY IF EXISTS "saved_filters_owner_write" ON public.saved_filters;
CREATE POLICY "saved_filters_owner_write" ON public.saved_filters
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_entity ON public.saved_filters (user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_shared ON public.saved_filters (empresa_id) WHERE is_shared;

DROP TRIGGER IF EXISTS trg_saved_filters_updated_at ON public.saved_filters;
CREATE TRIGGER trg_saved_filters_updated_at
  BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.saved_filter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_filter_id uuid NOT NULL REFERENCES public.saved_filters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  frequencia text NOT NULL DEFAULT 'diaria' CHECK (frequencia IN ('diaria','semanal','mensal')),
  canal text NOT NULL DEFAULT 'email' CHECK (canal IN ('email','push','whatsapp')),
  ativo boolean NOT NULL DEFAULT true,
  ultimo_envio_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_filter_subscriptions_unique UNIQUE (saved_filter_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_filter_subscriptions TO authenticated;
GRANT ALL ON public.saved_filter_subscriptions TO service_role;
ALTER TABLE public.saved_filter_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_filter_subscriptions_owner" ON public.saved_filter_subscriptions;
CREATE POLICY "saved_filter_subscriptions_owner" ON public.saved_filter_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_saved_filter_subs_updated_at ON public.saved_filter_subscriptions;
CREATE TRIGGER trg_saved_filter_subs_updated_at
  BEFORE UPDATE ON public.saved_filter_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.user_active_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_active_filters_unique UNIQUE (user_id, entity_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_active_filters TO authenticated;
GRANT ALL ON public.user_active_filters TO service_role;
ALTER TABLE public.user_active_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_active_filters_owner" ON public.user_active_filters;
CREATE POLICY "user_active_filters_owner" ON public.user_active_filters
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_user_active_filters_updated_at ON public.user_active_filters;
CREATE TRIGGER trg_user_active_filters_updated_at
  BEFORE UPDATE ON public.user_active_filters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();