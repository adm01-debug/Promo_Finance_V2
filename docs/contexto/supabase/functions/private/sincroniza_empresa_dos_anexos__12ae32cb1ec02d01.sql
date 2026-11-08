CREATE OR REPLACE FUNCTION private.sincroniza_empresa_dos_anexos()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.anexos_financeiros
     SET empresa_id = NEW.empresa_id
   WHERE entidade_id = NEW.id
     AND entidade_tipo IN (TG_ARGV[0], TG_ARGV[1]);
  RETURN NEW;
END;
$function$
