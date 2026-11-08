CREATE OR REPLACE FUNCTION public.registrar_evento_pagar(p_conta_id uuid, p_tipo text, p_mensagem text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := (select auth.uid());
  v_empresa uuid;
  v_found boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: autenticacao requerida';
  END IF;
  IF p_conta_id IS NULL THEN
    RAISE EXCEPTION 'Conta nao informada';
  END IF;

  SELECT true, cp.empresa_id INTO v_found, v_empresa
  FROM public.contas_pagar cp WHERE cp.id = p_conta_id;

  IF NOT COALESCE(v_found, false) THEN
    RAISE EXCEPTION 'Conta a pagar inexistente';
  END IF;
  IF v_empresa IS NOT NULL AND NOT public.empresa_acessivel(v_empresa) THEN
    RAISE EXCEPTION 'Acesso negado a empresa da conta informada';
  END IF;

  INSERT INTO public.audit_logs (
    user_id, table_name, record_id, action, details, new_data, created_at
  ) VALUES (
    v_uid,
    'contas_pagar',
    p_conta_id,
    COALESCE(p_tipo, 'evento'),
    p_mensagem,
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  );
END;
$function$
