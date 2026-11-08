CREATE OR REPLACE FUNCTION public.segredo_cron(p_chave text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_valor text;
BEGIN
  SELECT valor INTO v_valor
    FROM public.integration_secrets
   WHERE chave = p_chave
   LIMIT 1;

  IF v_valor IS NULL OR length(v_valor) < 16 THEN
    RAISE EXCEPTION 'Segredo interno "%" ausente ou fraco em integration_secrets', p_chave;
  END IF;

  RETURN v_valor;
END;
$function$
