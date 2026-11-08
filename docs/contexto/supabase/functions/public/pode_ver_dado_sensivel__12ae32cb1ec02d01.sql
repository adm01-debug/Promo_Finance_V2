CREATE OR REPLACE FUNCTION public.pode_ver_dado_sensivel()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role IN (SELECT unnest(ARRAY['admin','contador','financeiro','manager'])::public.app_role)) $function$
