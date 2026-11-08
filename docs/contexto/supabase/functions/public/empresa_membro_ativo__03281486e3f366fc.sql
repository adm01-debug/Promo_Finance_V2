CREATE OR REPLACE FUNCTION public.empresa_membro_ativo(_empresa_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT _empresa_id IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.user_empresas ue
       WHERE ue.empresa_id = _empresa_id
         AND ue.user_id = (SELECT auth.uid())
         AND ue.ativo = true
     );
$function$
