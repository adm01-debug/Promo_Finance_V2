CREATE OR REPLACE FUNCTION public.sync_integration_secret_identifier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  NEW.chave := COALESCE(NULLIF(btrim(NEW.chave), ''), NULLIF(btrim(NEW.nome), ''));
  NEW.nome := COALESCE(NULLIF(btrim(NEW.nome), ''), NEW.chave);

  IF NEW.chave IS NULL OR NEW.nome IS NULL THEN
    RAISE EXCEPTION 'integration_secrets exige chave ou nome não vazio'
      USING ERRCODE = '23502';
  END IF;

  RETURN NEW;
END;
$function$
