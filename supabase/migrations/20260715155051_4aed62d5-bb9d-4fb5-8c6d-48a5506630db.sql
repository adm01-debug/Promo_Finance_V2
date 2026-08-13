
CREATE OR REPLACE FUNCTION public.confirmar_conciliacao_manual(
  p_transacao_id uuid,
  p_conta_pagar_id uuid DEFAULT NULL::uuid,
  p_conta_receber_id uuid DEFAULT NULL::uuid,
  p_ajuste_centavos numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_empresa uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cb.empresa_id INTO v_empresa
  FROM public.transacoes_bancarias tb
  JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
  WHERE tb.id = p_transacao_id;

  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'transacao_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_empresas ue
    WHERE ue.user_id = v_uid AND ue.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  IF p_conta_pagar_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.contas_pagar cp
    WHERE cp.id = p_conta_pagar_id AND cp.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_conta_pagar' USING ERRCODE = '42501';
  END IF;

  IF p_conta_receber_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.contas_receber cr
    WHERE cr.id = p_conta_receber_id AND cr.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_conta_receber' USING ERRCODE = '42501';
  END IF;

  UPDATE public.transacoes_bancarias
  SET status = 'confirmado',
      data_confirmacao = now(),
      updated_at = now()
  WHERE id = p_transacao_id;

  IF p_conta_pagar_id IS NOT NULL THEN
    UPDATE public.contas_pagar
    SET status = 'pago',
        data_pagamento = COALESCE(data_pagamento, (SELECT data FROM public.transacoes_bancarias WHERE id = p_transacao_id)),
        valor_pago = valor,
        updated_at = now()
    WHERE id = p_conta_pagar_id;
  END IF;

  IF p_conta_receber_id IS NOT NULL THEN
    UPDATE public.contas_receber
    SET status = 'pago',
        data_recebimento = COALESCE(data_recebimento, (SELECT data FROM public.transacoes_bancarias WHERE id = p_transacao_id)),
        valor_recebido = valor,
        transacao_conciliada_id = p_transacao_id,
        updated_at = now()
    WHERE id = p_conta_receber_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_empresa uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT cb.empresa_id INTO v_empresa
  FROM public.transacoes_bancarias tb
  JOIN public.contas_bancarias cb ON cb.id = tb.conta_bancaria_id
  WHERE tb.id = p_transacao_id;

  IF v_empresa IS NULL THEN
    RAISE EXCEPTION 'transacao_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_empresas ue
    WHERE ue.user_id = v_uid AND ue.empresa_id = v_empresa
  ) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  UPDATE public.transacoes_bancarias
  SET status = 'pendente',
      data_confirmacao = NULL,
      confirmado_por = NULL,
      updated_at = now()
  WHERE id = p_transacao_id;

  UPDATE public.contas_receber
  SET transacao_conciliada_id = NULL,
      status = CASE WHEN data_vencimento < now()::date THEN 'vencido' ELSE 'pendente' END,
      updated_at = now()
  WHERE transacao_conciliada_id = p_transacao_id;
END;
$function$;
