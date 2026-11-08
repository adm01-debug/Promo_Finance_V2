CREATE OR REPLACE FUNCTION public.gerar_darf_retencoes(p_empresa_id uuid, p_competencia text, p_codigo_receita text, p_descricao_receita text, p_data_vencimento date, p_retencoes_ids uuid[])
 RETURNS darfs
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_ids uuid[];
  v_esperadas integer;
  v_disponiveis integer;
  v_total numeric;
  v_darf public.darfs;
  v_linhas integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  SELECT array_agg(DISTINCT x) INTO v_ids FROM unnest(COALESCE(p_retencoes_ids, '{}')) AS x;
  v_esperadas := COALESCE(cardinality(v_ids), 0);

  IF v_esperadas = 0 THEN
    RAISE EXCEPTION 'nenhuma_retencao_selecionada' USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.retencoes_fonte r
  WHERE r.id = ANY (v_ids)
  FOR UPDATE;

  SELECT count(*), COALESCE(sum(r.valor_retido), 0)
    INTO v_disponiveis, v_total
  FROM public.retencoes_fonte r
  WHERE r.id = ANY (v_ids)
    AND r.empresa_id = p_empresa_id
    AND COALESCE(r.darf_gerado, false) = false;

  IF v_disponiveis <> v_esperadas THEN
    RAISE EXCEPTION
      'retencoes_indisponiveis: % de % retenções estão disponíveis para esta empresa e ainda sem DARF',
      v_disponiveis, v_esperadas
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.darfs (
    empresa_id, codigo_receita, descricao_receita, competencia,
    valor_principal, valor_multa, valor_juros, valor_total,
    data_vencimento, status, retencoes_ids
  )
  VALUES (
    p_empresa_id, p_codigo_receita, p_descricao_receita, p_competencia,
    v_total, 0, 0, v_total,
    p_data_vencimento, 'gerado', v_ids
  )
  RETURNING * INTO v_darf;

  UPDATE public.retencoes_fonte
     SET darf_gerado = true
   WHERE id = ANY (v_ids);

  GET DIAGNOSTICS v_linhas = ROW_COUNT;
  IF v_linhas <> v_esperadas THEN
    RAISE EXCEPTION 'retencoes_nao_marcadas: % de % linhas afetadas', v_linhas, v_esperadas
      USING ERRCODE = '42501';
  END IF;

  RETURN v_darf;
END
$function$
