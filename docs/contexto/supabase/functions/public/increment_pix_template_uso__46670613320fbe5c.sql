CREATE OR REPLACE FUNCTION public.increment_pix_template_uso(p_template_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.pix_templates
     SET uso_count = COALESCE(uso_count, 0) + 1
   WHERE id = p_template_id;
END;
$function$
