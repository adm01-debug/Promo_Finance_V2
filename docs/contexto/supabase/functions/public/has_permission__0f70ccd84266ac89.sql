CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.permissions p
    JOIN public.role_permissions rp ON p.id = rp.permission_id
    JOIN public.user_roles ur ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND p.name = _permission_name
      AND ur.is_active = true
  );
END;
$function$
