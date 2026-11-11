CREATE OR REPLACE FUNCTION public.check_catalogos_tributarios_invariants()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN RETURN jsonb_build_object(
  'ufs_ok',(SELECT COUNT(*)=27 FROM public.ufs),
  'ncms_ok',(SELECT COUNT(*)>0 FROM public.ncms),
  'faixas_ok',(SELECT COUNT(*)>0 FROM public.faixas_simples_nacional),
  'checked_at',now()); END;
$function$
