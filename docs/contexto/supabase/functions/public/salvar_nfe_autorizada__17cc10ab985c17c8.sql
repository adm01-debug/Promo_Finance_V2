CREATE OR REPLACE FUNCTION public.salvar_nfe_autorizada(p_empresa_id uuid, p_nota jsonb, p_itens jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_nota public.notas_fiscais;
  v_desconhecidas text;
  v_colunas text;
  v_itens integer := 0;
  v_soma record;
  v_tem_grupo boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array' THEN
    RAISE EXCEPTION 'itens_devem_ser_array_jsonb' USING ERRCODE = '22023';
  END IF;

  IF p_nota IS NULL OR jsonb_typeof(p_nota) <> 'object' THEN
    RAISE EXCEPTION 'nota_invalida' USING ERRCODE = '22023';
  END IF;

  -- Mesma guarda de `registrar_nfe_com_creditos`: payload com coluna que não
  -- existe tem de falhar com o nome, não gravar silenciosamente pela metade.
  SELECT string_agg(k.chave, ', ' ORDER BY k.chave)
    INTO v_desconhecidas
  FROM jsonb_object_keys(p_nota) AS k(chave)
  WHERE k.chave NOT IN ('id', 'empresa_id')
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'notas_fiscais'
        AND c.column_name = k.chave
    );

  IF v_desconhecidas IS NOT NULL THEN
    RAISE EXCEPTION 'colunas_inexistentes_em_notas_fiscais: %', v_desconhecidas
      USING ERRCODE = '42703';
  END IF;

  -- Resolve a nota: reusa a linha da mesma chave de acesso (UNIQUE) quando já
  -- existe — reenviar a mesma NF-e não pode criar documento duplicado.
  IF p_nota->>'chave_acesso' IS NOT NULL THEN
    SELECT * INTO v_nota
    FROM public.notas_fiscais
    WHERE empresa_id = p_empresa_id
      AND chave_acesso = p_nota->>'chave_acesso';

    IF FOUND THEN
      UPDATE public.notas_fiscais
         SET xml_nfe = COALESCE(p_nota->>'xml_nfe', xml_nfe),
             status = COALESCE((p_nota->>'status')::public.status_nfe, status),
             protocolo = COALESCE(p_nota->>'protocolo', protocolo),
             updated_at = now()
       WHERE id = v_nota.id
       RETURNING * INTO v_nota;
    END IF;
  END IF;

  IF v_nota.id IS NULL THEN
    SELECT string_agg(quote_ident(k.chave), ', ' ORDER BY k.chave)
      INTO v_colunas
    FROM jsonb_object_keys(p_nota) AS k(chave)
    WHERE k.chave NOT IN ('id', 'empresa_id');

    IF v_colunas IS NULL THEN
      RAISE EXCEPTION 'nota_sem_campos' USING ERRCODE = '22023';
    END IF;

    EXECUTE format(
      'INSERT INTO public.notas_fiscais (empresa_id, %1$s) '
      'SELECT $1, %1$s FROM jsonb_populate_record(NULL::public.notas_fiscais, $2) '
      'RETURNING *',
      v_colunas
    )
    INTO v_nota
    USING p_empresa_id, p_nota;
  END IF;

  -- Passo 1: sem total na nota os dois triggers de conferência saem cedo.
  UPDATE public.notas_fiscais
     SET v_bc_ibscbs = NULL, v_ibs = NULL, v_ibs_uf = NULL,
         v_ibs_mun = NULL, v_cbs = NULL, v_is = NULL
   WHERE id = v_nota.id;

  -- Passo 2 e 3: troca do conjunto de itens.
  DELETE FROM public.notas_fiscais_itens WHERE nota_fiscal_id = v_nota.id;

  INSERT INTO public.notas_fiscais_itens (
    nota_fiscal_id, n_item, c_prod, x_prod, ncm, cfop, q_com, v_un_com, v_prod,
    cst_ibscbs, cclasstrib, v_bc_ibscbs,
    p_ibs_uf, v_ibs_uf, p_ibs_mun, v_ibs_mun, p_cbs, v_cbs,
    v_ibs, p_red_aliq, p_aliq_efet,
    cst_is, cclasstrib_is, v_bc_is, p_is, ad_rem_is, v_is
  )
  SELECT
    v_nota.id,
    i.n_item,
    i.c_prod,
    i.x_prod,
    i.ncm,
    i.cfop,
    i.q_com,
    i.v_un_com,
    i.v_prod,
    i.cst_ibscbs,
    i.cclasstrib,
    i.v_bc_ibscbs,
    i.p_ibs_uf,
    i.v_ibs_uf,
    i.p_ibs_mun,
    i.v_ibs_mun,
    i.p_cbs,
    i.v_cbs,
    -- Constraint `notas_fiscais_itens_v_ibs_soma_ck`: quando há vIBS, as duas
    -- parcelas precisam existir e somar. Derivar aqui elimina a hipótese de
    -- XML com vIBS destacado e uma das parcelas ausente.
    CASE
      WHEN i.v_ibs_uf IS NULL AND i.v_ibs_mun IS NULL THEN NULL
      ELSE COALESCE(i.v_ibs_uf, 0) + COALESCE(i.v_ibs_mun, 0)
    END,
    i.p_red_aliq,
    i.p_aliq_efet,
    i.cst_is,
    i.cclasstrib_is,
    i.v_bc_is,
    i.p_is,
    i.ad_rem_is,
    i.v_is
  FROM jsonb_to_recordset(p_itens) AS i(
    n_item integer,
    c_prod text,
    x_prod text,
    ncm text,
    cfop text,
    q_com numeric,
    v_un_com numeric,
    v_prod numeric,
    cst_ibscbs text,
    cclasstrib text,
    v_bc_ibscbs numeric,
    p_ibs_uf numeric,
    v_ibs_uf numeric,
    p_ibs_mun numeric,
    v_ibs_mun numeric,
    p_cbs numeric,
    v_cbs numeric,
    v_ibs numeric,
    p_red_aliq numeric,
    p_aliq_efet numeric,
    cst_is text,
    cclasstrib_is text,
    v_bc_is numeric,
    p_is numeric,
    ad_rem_is numeric,
    v_is numeric
  );

  GET DIAGNOSTICS v_itens = ROW_COUNT;

  -- Passo 4: totais derivados dos itens — é exatamente o que o trigger compara,
  -- então não há como divergir por arredondamento do lado do cliente.
  SELECT
    COALESCE(round(sum(v_bc_ibscbs), 2), 0) AS v_bc_ibscbs,
    COALESCE(round(sum(v_ibs), 2), 0)       AS v_ibs,
    COALESCE(round(sum(v_ibs_uf), 2), 0)    AS v_ibs_uf,
    COALESCE(round(sum(v_ibs_mun), 2), 0)   AS v_ibs_mun,
    COALESCE(round(sum(v_cbs), 2), 0)       AS v_cbs,
    COALESCE(round(sum(v_is), 2), 0)        AS v_is,
    bool_or(v_cbs IS NOT NULL OR v_ibs IS NOT NULL OR v_is IS NOT NULL
            OR v_bc_ibscbs IS NOT NULL)     AS tem_grupo
  INTO v_soma
  FROM public.notas_fiscais_itens
  WHERE nota_fiscal_id = v_nota.id;

  v_tem_grupo := COALESCE(v_soma.tem_grupo, false);

  UPDATE public.notas_fiscais
     SET v_bc_ibscbs = CASE WHEN v_tem_grupo THEN v_soma.v_bc_ibscbs END,
         v_ibs = CASE WHEN v_tem_grupo THEN v_soma.v_ibs END,
         v_ibs_uf = CASE WHEN v_tem_grupo THEN v_soma.v_ibs_uf END,
         v_ibs_mun = CASE WHEN v_tem_grupo THEN v_soma.v_ibs_mun END,
         v_cbs = CASE WHEN v_tem_grupo THEN v_soma.v_cbs END,
         v_is = CASE WHEN v_tem_grupo THEN v_soma.v_is END,
         updated_at = now()
   WHERE id = v_nota.id;

  RETURN jsonb_build_object(
    'nota_fiscal_id', v_nota.id,
    'chave_acesso', v_nota.chave_acesso,
    'itens', v_itens,
    'tem_grupo_ibscbs', v_tem_grupo,
    'totais', CASE WHEN v_tem_grupo THEN jsonb_build_object(
      'v_bc_ibscbs', v_soma.v_bc_ibscbs,
      'v_ibs', v_soma.v_ibs,
      'v_ibs_uf', v_soma.v_ibs_uf,
      'v_ibs_mun', v_soma.v_ibs_mun,
      'v_cbs', v_soma.v_cbs,
      'v_is', v_soma.v_is
    ) END
  );
END
$function$
