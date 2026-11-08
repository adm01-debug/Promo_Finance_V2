CREATE OR REPLACE FUNCTION public.get_user_roles(user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
$function$
