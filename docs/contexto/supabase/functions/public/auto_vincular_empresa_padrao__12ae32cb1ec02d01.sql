CREATE OR REPLACE FUNCTION public.auto_vincular_empresa_padrao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_empresa_id uuid;
BEGIN
  SELECT id INTO v_empresa_id FROM public.empresas WHERE is_padrao = true LIMIT 1;
  IF v_empresa_id IS NOT NULL THEN
    INSERT INTO public.user_empresas (user_id, empresa_id, ativo) VALUES (NEW.user_id, v_empresa_id, true) ON CONFLICT (user_id, empresa_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;$function$
