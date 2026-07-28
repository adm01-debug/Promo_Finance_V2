-- Fix IDOR: role/permission lookups must be self-scoped (or admin)
CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticacao requerida';
  END IF;

  IF get_user_roles.user_id IS DISTINCT FROM (select auth.uid())
     AND NOT public.has_role((select auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: consulta restrita ao proprio usuario';
  END IF;

  RETURN ARRAY(
    SELECT ur.role::text FROM public.user_roles ur
    WHERE ur.user_id = get_user_roles.user_id
      AND ur.is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticacao requerida';
  END IF;

  IF get_user_permissions.user_id IS DISTINCT FROM (select auth.uid())
     AND NOT public.has_role((select auth.uid()), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: consulta restrita ao proprio usuario';
  END IF;

  RETURN ARRAY(
    SELECT DISTINCT p.name
    FROM public.permissions p
    JOIN public.role_permissions rp ON p.id = rp.permission_id
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = get_user_permissions.user_id
      AND ur.is_active = true
  );
END;
$function$;

-- Fix cross-tenant leak: pending withholdings count must respect company access
CREATE OR REPLACE FUNCTION public.get_retencoes_pendentes_count(p_empresa_id uuid)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF p_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Empresa nao informada';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'Acesso negado a empresa informada';
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM public.retencoes_fonte
    WHERE empresa_id = p_empresa_id
      AND status = 'pendente'
      AND darf_gerado = false
  );
END;
$function$;

DO $$
DECLARE v_missing int;
BEGIN
  SELECT count(*) INTO v_missing
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_user_roles', 'get_user_permissions', 'get_retencoes_pendentes_count')
    AND pg_get_functiondef(p.oid) NOT ILIKE '%Acesso negado%';
  IF v_missing > 0 THEN
    RAISE EXCEPTION '% funcoes permanecem sem verificacao de autorizacao', v_missing;
  END IF;
END $$;