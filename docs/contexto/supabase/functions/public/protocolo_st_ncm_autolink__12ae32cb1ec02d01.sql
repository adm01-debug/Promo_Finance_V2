CREATE OR REPLACE FUNCTION public.protocolo_st_ncm_autolink()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.ncm_codigo IS NOT NULL AND NEW.ncm_id IS NULL THEN
    SELECT id INTO NEW.ncm_id FROM public.ncms WHERE codigo = NEW.ncm_codigo LIMIT 1;
  END IF;
  RETURN NEW;
END;
$function$
