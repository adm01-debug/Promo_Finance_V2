-- Tabela para persistir o checklist de configuração SCIM por usuário admin
CREATE TABLE IF NOT EXISTS public.scim_setup_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);

ALTER TABLE public.scim_setup_checklist ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler/gravar (compartilhado entre admins do tenant)
CREATE POLICY "Admins can view scim checklist"
  ON public.scim_setup_checklist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert scim checklist"
  ON public.scim_setup_checklist FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins can update scim checklist"
  ON public.scim_setup_checklist FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scim checklist"
  ON public.scim_setup_checklist FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_scim_setup_checklist_updated_at
  BEFORE UPDATE ON public.scim_setup_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_scim_setup_checklist_user
  ON public.scim_setup_checklist(user_id);