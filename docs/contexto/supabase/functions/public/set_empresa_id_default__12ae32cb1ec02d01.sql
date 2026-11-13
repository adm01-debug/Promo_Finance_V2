CREATE OR REPLACE FUNCTION public.set_empresa_id_default()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_empresa uuid;
BEGIN
  IF NEW.empresa_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT ue.empresa_id INTO v_empresa
  FROM public.user_empresas ue
  WHERE ue.user_id = auth.uid() AND ue.ativo = true
  ORDER BY ue.is_default DESC NULLS LAST, ue.created_at
  LIMIT 1;

  IF v_empresa IS NULL THEN
    SELECT e.id INTO v_empresa FROM public.empresas e ORDER BY e.created_at LIMIT 1;
  END IF;

  NEW.empresa_id := v_empresa;
  RETURN NEW;
END;
$function$
