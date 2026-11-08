CREATE OR REPLACE FUNCTION public.provisionar_usuario(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_empresa_id uuid;
BEGIN
  INSERT INTO public.profiles (id, updated_at) VALUES (_user_id, now()) ON CONFLICT (id) DO NOTHING;
  SELECT id INTO v_empresa_id FROM public.empresas WHERE is_padrao = true LIMIT 1;
  IF v_empresa_id IS NOT NULL THEN
    INSERT INTO public.user_empresas (user_id, empresa_id, ativo) VALUES (_user_id, v_empresa_id, true) ON CONFLICT (user_id, empresa_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'visualizador') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;$function$
