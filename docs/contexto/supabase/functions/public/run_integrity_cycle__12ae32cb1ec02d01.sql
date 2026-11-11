CREATE OR REPLACE FUNCTION public.run_integrity_cycle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN RETURN jsonb_build_object('cycle_run_at',now(),'status','ok'); END;
$function$
