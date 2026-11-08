CREATE OR REPLACE FUNCTION public.internal_job_secret()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'pg_catalog'
AS $function$ SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'regua_cron_secret' LIMIT 1 $function$
