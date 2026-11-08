CREATE OR REPLACE FUNCTION public.validar_catalogos_tributarios()
 RETURNS TABLE(tabela text, registros bigint, status text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT 'ufs'::text,COUNT(*)::bigint,CASE WHEN COUNT(*)=27 THEN 'OK' ELSE 'INCOMPLETO' END FROM public.ufs UNION ALL
  SELECT 'ncms',COUNT(*),CASE WHEN COUNT(*)>0 THEN 'OK' ELSE 'VAZIO' END FROM public.ncms UNION ALL
  SELECT 'faixas_simples',COUNT(*),CASE WHEN COUNT(*)>0 THEN 'OK' ELSE 'VAZIO' END FROM public.faixas_simples_nacional UNION ALL
  SELECT 'aliq_interestad',COUNT(*),CASE WHEN COUNT(*)>0 THEN 'OK' ELSE 'VAZIO' END FROM public.aliquotas_interestaduais;
$function$
