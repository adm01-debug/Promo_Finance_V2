-- Recriar public.user_active_filters com schema correto: user_id, entity_type, payload(jsonb)
-- O frontend usa upsert onConflict: 'user_id,entity_type' e lê .payload

DROP TABLE IF EXISTS public.user_active_filters CASCADE;

CREATE TABLE public.user_active_filters (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_user_active_filters_user ON public.user_active_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_filters_entity ON public.user_active_filters(entity_type);

ALTER TABLE public.user_active_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_filters" ON public.user_active_filters;
CREATE POLICY "users_own_filters" ON public.user_active_filters
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admins_all_user_active_filters" ON public.user_active_filters;
CREATE POLICY "admins_all_user_active_filters" ON public.user_active_filters
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

NOTIFY pgrst, 'reload schema';
