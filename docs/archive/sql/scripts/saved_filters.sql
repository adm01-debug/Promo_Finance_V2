-- Tabela: saved_filters (presets de filtros salvos por usuário/entidade)
-- Schema derivado de src/hooks/useSavedFilters.ts

CREATE TABLE IF NOT EXISTS public.saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  is_shared boolean NOT NULL DEFAULT false,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  shared_with_roles text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_entity ON public.saved_filters(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_empresa ON public.saved_filters(empresa_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_shared ON public.saved_filters(is_shared);

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_filters_owner_all ON public.saved_filters;
CREATE POLICY saved_filters_owner_all ON public.saved_filters
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS saved_filters_shared_read ON public.saved_filters;
CREATE POLICY saved_filters_shared_read ON public.saved_filters
  FOR SELECT TO authenticated
  USING (is_shared = true);

DROP POLICY IF EXISTS saved_filters_admin_all ON public.saved_filters;
CREATE POLICY saved_filters_admin_all ON public.saved_filters
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

NOTIFY pgrst, 'reload schema';
