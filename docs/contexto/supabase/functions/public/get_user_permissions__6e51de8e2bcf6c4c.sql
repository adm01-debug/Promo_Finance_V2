CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
$function$
