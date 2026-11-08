CREATE OR REPLACE FUNCTION public.is_org_responsavel(_org_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT
    CASE
      WHEN (SELECT auth.uid()) IS NULL THEN TRUE
      WHEN _user_id = (SELECT auth.uid()) THEN TRUE
      WHEN public.has_role((SELECT auth.uid()), 'admin'::public.app_role) THEN TRUE
      ELSE FALSE
    END
    AND EXISTS (
      SELECT 1 FROM public.organizacoes
      WHERE id = _org_id AND responsavel_id = _user_id
    );
$function$
