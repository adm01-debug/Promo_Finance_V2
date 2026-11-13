CREATE OR REPLACE FUNCTION public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_cp public.contas_pagar%ROWTYPE;
BEGIN
  -- Lock ordenado para evitar deadlock (nfe < conta)
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT public.empresa_acessivel(v_nfe.empresa_id) THEN
    RAISE EXCEPTION 'Sem permissão para esta NFe' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cp FROM public.contas_pagar WHERE id = p_conta_pagar_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta a pagar % não encontrada ou removida', p_conta_pagar_id USING ERRCODE = 'no_data_found';
  END IF;

  IF v_cp.empresa_id IS DISTINCT FROM v_nfe.empresa_id THEN
    RAISE EXCEPTION 'Conta a pagar % pertence a outra empresa', p_conta_pagar_id USING ERRCODE = '42501';
  END IF;

  -- Idempotente: já vinculada
  IF v_nfe.conta_pagar_id = p_conta_pagar_id THEN
    RETURN jsonb_build_object('ok', true, 'already_linked', true, 'conta_pagar_id', p_conta_pagar_id);
  END IF;

  -- NFe já ligada a outra conta
  IF v_nfe.conta_pagar_id IS NOT NULL AND v_nfe.conta_pagar_id <> p_conta_pagar_id THEN
    RAISE EXCEPTION 'NFe já está vinculada à conta %', v_nfe.conta_pagar_id USING ERRCODE = 'unique_violation';
  END IF;

  -- Conta já usada por outra NFe
  IF EXISTS (
    SELECT 1 FROM public.nfe_recebidas nr2
    WHERE nr2.conta_pagar_id = p_conta_pagar_id AND nr2.id <> p_nfe_id
  ) THEN
    RAISE EXCEPTION 'Conta a pagar % já está vinculada a outra NFe', p_conta_pagar_id USING ERRCODE = 'unique_violation';
  END IF;

  UPDATE public.nfe_recebidas
  SET conta_pagar_id = p_conta_pagar_id,
      updated_at = now()
  WHERE id = p_nfe_id;

  UPDATE public.contas_pagar
  SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'nfe_chave', v_nfe.chave_acesso,
        'nfe_id', p_nfe_id::text,
        'nfe_vinculo_em', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ),
      updated_at = now()
  WHERE id = p_conta_pagar_id;

  RETURN jsonb_build_object('ok', true, 'already_linked', false, 'conta_pagar_id', p_conta_pagar_id);
END;
$function$
