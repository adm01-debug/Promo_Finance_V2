CREATE OR REPLACE FUNCTION public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date DEFAULT NULL::date, p_categoria_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_nfe public.nfe_recebidas%ROWTYPE;
  v_forn_id uuid;
  v_cnpj text;
  v_new_cp uuid;
  v_venc date;
BEGIN
  SELECT * INTO v_nfe FROM public.nfe_recebidas WHERE id = p_nfe_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NFe % não encontrada', p_nfe_id USING ERRCODE = 'no_data_found';
  END IF;

  IF v_nfe.conta_pagar_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_linked', true, 'conta_pagar_id', v_nfe.conta_pagar_id);
  END IF;

  IF v_nfe.valor_total IS NULL OR v_nfe.valor_total <= 0 THEN
    RAISE EXCEPTION 'NFe % sem valor_total válido para gerar conta a pagar', p_nfe_id USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_cnpj := regexp_replace(coalesce(v_nfe.cnpj_emitente, ''), '\D', '', 'g');

  -- Match / cria fornecedor
  SELECT id INTO v_forn_id FROM public.fornecedores
   WHERE regexp_replace(coalesce(cnpj,''), '\D', '', 'g') = v_cnpj AND v_cnpj <> ''
   LIMIT 1;

  IF v_forn_id IS NULL AND v_cnpj <> '' THEN
    INSERT INTO public.fornecedores (razao_social, cnpj, user_id)
    VALUES (coalesce(v_nfe.razao_emitente, v_cnpj), v_cnpj, auth.uid())
    RETURNING id INTO v_forn_id;
  END IF;

  v_venc := coalesce(p_data_vencimento, (coalesce(v_nfe.data_emissao, now())::date + INTERVAL '30 days')::date);

  INSERT INTO public.contas_pagar (
    descricao, valor, data_vencimento, status, fornecedor_id, empresa_id,
    numero_documento, categoria_id, metadata, user_id, fornecedor_nome
  )
  VALUES (
    left(concat('NFe ', coalesce(v_nfe.numero, '?'), ' - ', coalesce(v_nfe.razao_emitente, v_cnpj)), 255),
    v_nfe.valor_total,
    v_venc,
    'pendente',
    v_forn_id,
    v_nfe.empresa_id,
    v_nfe.chave_acesso,
    p_categoria_id,
    jsonb_build_object(
      'origem', 'nfe_recebida',
      'nfe_id', p_nfe_id::text,
      'nfe_chave', v_nfe.chave_acesso,
      'nfe_numero', v_nfe.numero,
      'nfe_serie', v_nfe.serie
    ),
    auth.uid(),
    v_nfe.razao_emitente
  )
  RETURNING id INTO v_new_cp;

  UPDATE public.nfe_recebidas
  SET conta_pagar_id = v_new_cp, updated_at = now()
  WHERE id = p_nfe_id;

  RETURN jsonb_build_object('ok', true, 'already_linked', false, 'conta_pagar_id', v_new_cp, 'fornecedor_id', v_forn_id);
END;
$function$
