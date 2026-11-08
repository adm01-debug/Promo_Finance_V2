CREATE OR REPLACE FUNCTION public.empresa_padrao_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$ SELECT empresa_id FROM public.user_empresas WHERE user_id = (SELECT auth.uid()) AND COALESCE(ativo, true) ORDER BY created_at LIMIT 1 $function$
