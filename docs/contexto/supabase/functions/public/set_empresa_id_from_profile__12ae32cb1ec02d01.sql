CREATE OR REPLACE FUNCTION public.set_empresa_id_from_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.empresa_id IS NULL THEN
    SELECT p.empresa_id INTO NEW.empresa_id
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$function$
