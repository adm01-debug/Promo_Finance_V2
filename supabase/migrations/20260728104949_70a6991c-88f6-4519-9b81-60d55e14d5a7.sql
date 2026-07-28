-- Fix broken columns + add authorization + author stamping on account event logging

CREATE OR REPLACE FUNCTION public.registrar_evento_receber(
  p_conta_id uuid,
  p_evento text DEFAULT NULL::text,
  p_detalhes jsonb DEFAULT '{}'::jsonb,
  p_tipo text DEFAULT 'sistema'::text,
  p_mensagem text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
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

  SELECT true, cr.empresa_id INTO v_found, v_empresa
  FROM public.contas_receber cr WHERE cr.id = p_conta_id;

  IF NOT COALESCE(v_found, false) THEN
    RAISE EXCEPTION 'Conta a receber inexistente';
  END IF;
  IF v_empresa IS NOT NULL AND NOT public.empresa_acessivel(v_empresa) THEN
    RAISE EXCEPTION 'Acesso negado a empresa da conta informada';
  END IF;

  INSERT INTO public.logs_baixa_automatica (
    user_id, conta_receber_id, resultado, mensagem, detalhes, created_at
  ) VALUES (
    v_uid,
    p_conta_id,
    COALESCE(p_tipo, p_evento, 'evento'),
    p_mensagem,
    COALESCE(NULLIF(p_metadata, '{}'::jsonb), p_detalhes, '{}'::jsonb),
    now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_evento_pagar(
  p_conta_id uuid,
  p_tipo text,
  p_mensagem text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
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
$function$;

DO $$
DECLARE v_bad int;
BEGIN
  SELECT count(*) INTO v_bad
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('registrar_evento_pagar', 'registrar_evento_receber')
    AND pg_get_function_identity_arguments(p.oid) <> 'p_conta_id uuid, p_evento text, p_detalhes jsonb'
    AND pg_get_functiondef(p.oid) NOT ILIKE '%empresa_acessivel%';
  IF v_bad > 0 THEN
    RAISE EXCEPTION '% funcoes de evento permanecem sem verificacao de empresa', v_bad;
  END IF;
END $$;