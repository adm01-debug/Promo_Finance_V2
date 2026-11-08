CREATE OR REPLACE FUNCTION public.empresa_acessivel(_empresa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _empresa_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.user_empresas ue
       WHERE ue.empresa_id = _empresa_id
         AND ue.user_id = (SELECT auth.uid())
         AND COALESCE(ue.ativo, true)
     )
$function$
