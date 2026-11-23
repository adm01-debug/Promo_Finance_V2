CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _user_id IS NULL OR _roles IS NULL OR (SELECT auth.uid()) IS NULL THEN false
    WHEN _user_id = (SELECT auth.uid())
      OR (SELECT auth.role()) = 'service_role'
      OR EXISTS (
        SELECT 1
        FROM public.user_roles AS caller_role
        WHERE caller_role.user_id = (SELECT auth.uid())
          AND caller_role.role = 'admin'::public.app_role
      )
    THEN EXISTS (
      SELECT 1
      FROM public.user_roles AS target_role
      WHERE target_role.user_id = _user_id
        AND target_role.role = ANY (_roles)
    )
    ELSE false
  END
$function$
