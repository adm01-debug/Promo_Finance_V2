CREATE OR REPLACE FUNCTION public.definir_empresa_padrao(_empresa_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ativo boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem definir a empresa padrão';
  END IF;

  SELECT COALESCE(ativo, true) INTO v_ativo FROM public.empresas WHERE id = _empresa_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empresa inexistente';
  END IF;
  IF NOT v_ativo THEN
    RAISE EXCEPTION 'Empresa inativa não pode ser a padrão';
  END IF;

  UPDATE public.empresas SET is_padrao = true WHERE id = _empresa_id;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data, details)
  VALUES (auth.uid(), 'EMPRESA_PADRAO_DEFINIDA', 'empresas', _empresa_id::text,
          jsonb_build_object('empresa_id', _empresa_id), 'Empresa padrão alterada');

  RETURN jsonb_build_object('ok', true, 'empresa_id', _empresa_id);
END;
$function$
