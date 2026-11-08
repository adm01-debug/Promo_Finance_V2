CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'private', 'pg_catalog'
AS $function$ SELECT private.exec_sql(sql) $function$
