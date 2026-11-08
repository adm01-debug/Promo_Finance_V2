CREATE OR REPLACE FUNCTION public.pix_template_sync_legacy()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.favorecido_nome := COALESCE(NEW.favorecido_nome, NEW.beneficiario_nome);
  NEW.beneficiario_nome := COALESCE(NEW.beneficiario_nome, NEW.favorecido_nome);
  NEW.tipo_chave_pix := COALESCE(NEW.tipo_chave_pix, NEW.tipo_chave);
  NEW.tipo_chave := COALESCE(NEW.tipo_chave, NEW.tipo_chave_pix);
  IF NEW.favorecido_nome IS NULL OR NEW.tipo_chave_pix IS NULL THEN
    RAISE EXCEPTION 'favorecido_nome e tipo_chave_pix são obrigatórios';
  END IF;
  RETURN NEW;
END;
$function$
