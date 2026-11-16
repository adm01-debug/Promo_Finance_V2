CREATE OR REPLACE FUNCTION public.is_ip_allowed_for_login(_ip inet)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.allowed_ips ai WHERE ai.ativo IS TRUE) THEN
    RETURN NULL;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_ips ai
    WHERE ai.ativo IS TRUE
      AND CASE
        WHEN pg_catalog.pg_input_is_valid(btrim(ai.ip_address), 'inet')
          THEN btrim(ai.ip_address)::inet >>= _ip
        ELSE false
      END
  );
END
$function$
