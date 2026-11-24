CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    WHEN (SELECT auth.role()) = 'service_role'
    THEN EXISTS (
      SELECT 1 FROM public.user_roles AS target_role
      WHERE target_role.user_id = _user_id AND target_role.role = _role
    )
    WHEN (SELECT auth.uid()) IS NULL THEN false
    WHEN _user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.user_roles AS caller_role
        WHERE caller_role.user_id = (SELECT auth.uid())
          AND caller_role.role = 'admin'::public.app_role
      )
    THEN EXISTS (
      SELECT 1 FROM public.user_roles AS target_role
      WHERE target_role.user_id = _user_id AND target_role.role = _role
    )
    ELSE false
  END
$function$
