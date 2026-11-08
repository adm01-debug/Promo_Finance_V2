CREATE OR REPLACE FUNCTION public.profile_sensitive_fields_unchanged(_profile_id uuid, _user_id uuid, _role text, _empresa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _profile_id
      AND p.user_id IS NOT DISTINCT FROM _user_id
      AND p.role IS NOT DISTINCT FROM _role
      AND p.empresa_id IS NOT DISTINCT FROM _empresa_id
  );
$function$
