CREATE OR REPLACE FUNCTION public.gate_32_pii_sem_mascara()
 RETURNS TABLE(objeto text, coluna text, motivo text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.relname::text, 'chave_pix',
         'view expõe chave_pix sem mascarar_chave_pix()/pode_ver_dado_sensivel()'
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'chave_pix' AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'public'
    AND c.relkind IN ('v','m')
    AND pg_get_viewdef(c.oid, true) NOT ILIKE '%mascarar_chave_pix%'
  ORDER BY 1;
$function$
