CREATE OR REPLACE FUNCTION public.aprovar_solicitacao_pagamento(p_solicitacao_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_conta_pagar_id uuid;
  v_fornecedor text;
  v_linhas integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT s.conta_pagar_id
    INTO v_conta_pagar_id
  FROM public.solicitacoes_aprovacao s
  WHERE s.id = p_solicitacao_id
    AND s.status = 'pendente'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'solicitacao_nao_pendente' USING ERRCODE = 'P0002';
  END IF;

  IF v_conta_pagar_id IS NULL THEN
    RAISE EXCEPTION 'solicitacao_sem_conta_pagar' USING ERRCODE = '22023';
  END IF;

  UPDATE public.contas_pagar
     SET aprovado_por = v_uid,
         updated_at = now()
   WHERE id = v_conta_pagar_id
  RETURNING fornecedor_nome INTO v_fornecedor;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> 1 THEN
    RAISE EXCEPTION 'conta_pagar_inacessivel' USING ERRCODE = '42501';
  END IF;

  UPDATE public.solicitacoes_aprovacao
     SET status = 'aprovado',
         aprovado_por = v_uid,
         aprovado_em = now()
   WHERE id = p_solicitacao_id;

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> 1 THEN
    RAISE EXCEPTION 'solicitacao_inacessivel' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'solicitacao_id', p_solicitacao_id,
    'conta_pagar_id', v_conta_pagar_id,
    'fornecedor_nome', v_fornecedor,
    'aprovado_por', v_uid
  );
END
$function$
