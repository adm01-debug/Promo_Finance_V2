-- Fix privilege escalation via mutable profiles.role / profiles.empresa_id.

-- 1) Prevent non-admin users from changing security-sensitive profile fields.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Não é permitido alterar o perfil de acesso diretamente.';
    END IF;

    IF NEW.empresa_id IS DISTINCT FROM OLD.empresa_id THEN
      RAISE EXCEPTION 'Não é permitido alterar a empresa do perfil diretamente.';
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Não é permitido alterar identificadores do perfil.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2) Tighten profile policies to authenticated users and keep own-profile editing only.
DROP POLICY IF EXISTS "Users can update own data" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own data" ON public.profiles;
DROP POLICY IF EXISTS "users manage own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

CREATE POLICY "Admins can manage profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Replace profile-based access policies with role and user_empresas checks.
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;

CREATE POLICY "Budgets scoped by owner or empresa"
  ON public.budgets
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR company_id IN (
      SELECT ue.empresa_id FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.ativo = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR company_id IN (
      SELECT ue.empresa_id FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.ativo = true
    )
  );

DROP POLICY IF EXISTS "Users can manage categories of their company" ON public.categorias;
DROP POLICY IF EXISTS "Users can view categories of their company" ON public.categorias;

CREATE POLICY "Categorias scoped by empresa"
  ON public.categorias
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR empresa_id IN (
      SELECT ue.empresa_id FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.ativo = true
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR empresa_id IN (
      SELECT ue.empresa_id FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.ativo = true
    )
  );

DROP POLICY IF EXISTS "Users can manage custom field definitions" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Users can manage their own custom field definitions" ON public.custom_field_definitions;

CREATE POLICY "Custom field definitions scoped by empresa"
  ON public.custom_field_definitions
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR empresa_id IN (
      SELECT ue.empresa_id FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.ativo = true
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR empresa_id IN (
      SELECT ue.empresa_id FROM public.user_empresas ue
      WHERE ue.user_id = auth.uid() AND ue.ativo = true
    )
  );

DROP POLICY IF EXISTS "Users can manage custom field values" ON public.custom_field_values;
DROP POLICY IF EXISTS "Users can manage their own custom field values" ON public.custom_field_values;

CREATE POLICY "Custom field values scoped by definition empresa"
  ON public.custom_field_values
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_field_definitions d
      WHERE d.id = custom_field_values.definition_id
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR d.empresa_id IN (
            SELECT ue.empresa_id FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid() AND ue.ativo = true
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.custom_field_definitions d
      WHERE d.id = custom_field_values.definition_id
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR d.empresa_id IN (
            SELECT ue.empresa_id FROM public.user_empresas ue
            WHERE ue.user_id = auth.uid() AND ue.ativo = true
          )
        )
    )
  );

DROP POLICY IF EXISTS "Admins can view all performance logs" ON public.frontend_performance_logs;
CREATE POLICY "Admins can view performance logs"
  ON public.frontend_performance_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view SSO login attempts" ON public.sso_login_attempts;
CREATE POLICY "Admins can view SSO login attempts"
  ON public.sso_login_attempts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_budgets_company_user ON public.budgets(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON public.categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_empresa ON public.custom_field_definitions(empresa_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_definition ON public.custom_field_values(definition_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);