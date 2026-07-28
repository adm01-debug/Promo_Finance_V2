CREATE OR REPLACE FUNCTION public.auto_vincular_empresa_padrao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa uuid;
BEGIN
  SELECT id INTO v_empresa FROM public.empresas ORDER BY created_at LIMIT 1;
  IF v_empresa IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.user_empresas (user_id, empresa_id, role, is_default, provisioned_via, ativo)
  VALUES (NEW.user_id, v_empresa, NEW.role, true, 'manual', true)
  ON CONFLICT (user_id, empresa_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_vincular_empresa_padrao() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_auto_vincular_empresa_padrao ON public.user_roles;
CREATE TRIGGER trg_auto_vincular_empresa_padrao
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.auto_vincular_empresa_padrao();

CREATE OR REPLACE FUNCTION public.gate_25_policies_sem_tenant()
RETURNS TABLE(tabela text, policy_name text, cmd text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.tablename::text, p.policyname::text, p.cmd::text
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = p.tablename AND c.column_name = 'empresa_id'
    )
    AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) LIKE '%has_role%'
    AND (coalesce(p.qual,'') || coalesce(p.with_check,'')) NOT LIKE '%empresa%'
  ORDER BY 1, 2;
$$;

REVOKE EXECUTE ON FUNCTION public.gate_25_policies_sem_tenant() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gate_25_policies_sem_tenant() TO service_role;