CREATE OR REPLACE FUNCTION public.get_ultima_carga_fiscal()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  SELECT to_jsonb(c) INTO v
    FROM public.catalogos_fiscais_cargas c
   ORDER BY c.last_updated DESC
   LIMIT 1;

  RETURN COALESCE(v, '{}'::jsonb);
END;
$function$
