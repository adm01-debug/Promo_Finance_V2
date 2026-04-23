-- Tabela para persistir grupos do IdP por usuário/provedor a cada login SSO
CREATE TABLE public.sso_user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  groups TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  matched_group TEXT,
  matched_role app_role,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

CREATE INDEX idx_sso_user_groups_user ON public.sso_user_groups(user_id);
CREATE INDEX idx_sso_user_groups_provider ON public.sso_user_groups(provider_id);
CREATE INDEX idx_sso_user_groups_groups ON public.sso_user_groups USING GIN(groups);

ALTER TABLE public.sso_user_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own SSO groups"
  ON public.sso_user_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all SSO groups"
  ON public.sso_user_groups FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage SSO groups"
  ON public.sso_user_groups FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sso_user_groups_updated_at
  BEFORE UPDATE ON public.sso_user_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();