CREATE OR REPLACE FUNCTION public.registrar_nfe_com_creditos(p_empresa_id uuid, p_nota jsonb, p_creditos jsonb DEFAULT '[]'::jsonb, p_itens jsonb DEFAULT '[]'::jsonb)
 RETURNS notas_fiscais
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_nota public.notas_fiscais;
  v_desconhecidas text;
  v_itens_desconhecidos text;
  v_colunas text;
  v_esperados integer := COALESCE(jsonb_array_length(COALESCE(p_creditos, '[]'::jsonb)), 0);
  v_itens_esperados integer := COALESCE(jsonb_array_length(COALESCE(p_itens, '[]'::jsonb)), 0);
  v_linhas integer;
  v_itens_gravados integer;
  v_soma record;
  v_tem_grupo boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT public.empresa_acessivel(p_empresa_id) THEN
    RAISE EXCEPTION 'forbidden_empresa_access' USING ERRCODE = '42501';
  END IF;

  IF p_nota IS NULL OR jsonb_typeof(p_nota) <> 'object' THEN
    RAISE EXCEPTION 'nota_invalida' USING ERRCODE = '22023';
  END IF;

  IF p_itens IS NOT NULL AND jsonb_typeof(p_itens) <> 'array' THEN
    RAISE EXCEPTION 'itens_invalidos' USING ERRCODE = '22023';
  END IF;

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

  -- Mesma guarda para os itens: `nota_fiscal_id` e derivado aqui, nao aceito do
  -- cliente (a nota ainda nem existe quando o payload chega).
  IF v_itens_esperados > 0 THEN
    SELECT string_agg(DISTINCT k.chave, ', ' ORDER BY k.chave)
      INTO v_itens_desconhecidos
    FROM jsonb_array_elements(p_itens) AS e(item),
         jsonb_object_keys(e.item) AS k(chave)
    WHERE k.chave <> 'nota_fiscal_id'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'notas_fiscais_itens'
          AND c.column_name = k.chave
      );

    IF v_itens_desconhecidos IS NOT NULL THEN
      RAISE EXCEPTION 'colunas_inexistentes_em_notas_fiscais_itens: %', v_itens_desconhecidos
        USING ERRCODE = '42703';
    END IF;
  END IF;

  SELECT string_agg(quote_ident(k.chave), ', ' ORDER BY k.chave)
    INTO v_colunas
  FROM jsonb_object_keys(p_nota) AS k(chave)
  WHERE k.chave NOT IN ('id', 'empresa_id')
    -- Quando ha itens, os totais do grupo saem dos itens (passo 3), nunca do
    -- payload: aceitar o total declarado junto com os itens deixaria o
    -- BEFORE INSERT de `notas_fiscais_verifica_totais_ibscbs` comparar o total
    -- do cliente com uma tabela de itens ainda vazia e recusar a nota inteira
    -- com rejeicao 1091. O cliente nao manda esses campos hoje; a exclusao e o
    -- que torna a derivacao uma garantia, e nao um acaso do payload.
    AND NOT (
      v_itens_esperados > 0
      AND k.chave IN ('v_bc_ibscbs', 'v_ibs', 'v_ibs_uf', 'v_ibs_mun', 'v_cbs', 'v_is')
    );

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

  IF v_esperados > 0 THEN
    INSERT INTO public.creditos_tributarios (
      empresa_id, nota_fiscal_id, tipo_tributo, valor_credito,
      saldo_disponivel, data_origem, competencia_origem, status,
      origem, efeito_tributario, ano_fato_gerador, documento_chave, documento_tipo
    )
    SELECT
      p_empresa_id,
      v_nota.id,
      c.tipo_tributo,
      c.valor_credito,
      COALESCE(c.saldo_disponivel, c.valor_credito),
      c.data_origem,
      c.competencia_origem,
      COALESCE(c.status, 'disponivel'),
      COALESCE(c.origem, 'estimado'::public.origem_credito_tributario),
      COALESCE(c.efeito_tributario, false),
      c.ano_fato_gerador,
      v_nota.chave_acesso,
      'nfe'
    FROM jsonb_to_recordset(p_creditos) AS c(
      tipo_tributo text,
      valor_credito numeric,
      saldo_disponivel numeric,
      data_origem date,
      competencia_origem text,
      status text,
      origem public.origem_credito_tributario,
      efeito_tributario boolean,
      ano_fato_gerador integer
    );

    GET DIAGNOSTICS v_linhas = ROW_COUNT;
    IF v_linhas <> v_esperados THEN
      RAISE EXCEPTION 'creditos_nao_gravados: % de % linhas', v_linhas, v_esperados
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_itens_esperados > 0 THEN
    -- Passo 1: os totais do cabecalho ficam NULL enquanto os itens entram. Nesta
    -- RPC a nota e sempre nova (o INSERT acima ja a criou sem os totais do
    -- grupo), mas manter o mesmo contrato da etapa 55 protege a conferencia caso
    -- a funcao venha a reaproveitar uma nota existente: o trigger dispara em
    -- UPDATE OF dessas colunas e sairia com 1091 na primeira linha inserida.
    UPDATE public.notas_fiscais
       SET v_bc_ibscbs = NULL, v_ibs = NULL, v_ibs_uf = NULL,
           v_ibs_mun = NULL, v_cbs = NULL, v_is = NULL
     WHERE id = v_nota.id;

    -- Passo 2: o DELETE deixa a insercao abaixo como unico conjunto de itens
    -- desta nota. Esta RPC sempre cria uma nota nova (o INSERT do passo 0 nao
    -- tem upsert), entao rechamar com a mesma `chave_acesso` nao substitui os
    -- itens da nota existente: bate na constraint UNIQUE e desfaz tudo. Nota
    -- importada antes da etapa 45 continua sem itens — a reimportacao nao a
    -- completa.
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
      n.v_ibs_uf,
      i.p_ibs_mun,
      n.v_ibs_mun,
      i.p_cbs,
      i.v_cbs,
      n.v_ibs,
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
      p_red_aliq numeric,
      p_aliq_efet numeric,
      cst_is text,
      cclasstrib_is text,
      v_bc_is numeric,
      p_is numeric,
      ad_rem_is numeric,
      v_is numeric
    )
    -- Constraint `notas_fiscais_itens_v_ibs_soma_ck` exige, quando v_ibs nao e
    -- nulo, as duas parcelas NOT NULL e somando exatamente. Normalizar aqui as
    -- parcelas ausentes para 0 (em vez de deixar v_ibs nulo) mantem tambem a
    -- coerencia entre SUM(v_ibs), SUM(v_ibs_uf) e SUM(v_ibs_mun) nos totais
    -- derivados da nota - os tres continuam fechando entre si.
    CROSS JOIN LATERAL (
      SELECT
        CASE WHEN i.v_ibs_uf IS NULL AND i.v_ibs_mun IS NULL THEN NULL
             ELSE COALESCE(i.v_ibs_uf, 0) END AS v_ibs_uf,
        CASE WHEN i.v_ibs_uf IS NULL AND i.v_ibs_mun IS NULL THEN NULL
             ELSE COALESCE(i.v_ibs_mun, 0) END AS v_ibs_mun,
        CASE WHEN i.v_ibs_uf IS NULL AND i.v_ibs_mun IS NULL THEN NULL
             ELSE COALESCE(i.v_ibs_uf, 0) + COALESCE(i.v_ibs_mun, 0) END AS v_ibs
    ) AS n;

    GET DIAGNOSTICS v_itens_gravados = ROW_COUNT;
    IF v_itens_gravados <> v_itens_esperados THEN
      RAISE EXCEPTION 'itens_nao_gravados: % de % linhas', v_itens_gravados, v_itens_esperados
        USING ERRCODE = '22023';
    END IF;

    -- Passo 3: totais derivados dos itens - exatamente o que o trigger compara.
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
     WHERE id = v_nota.id
    RETURNING * INTO v_nota;
  ELSE
    RETURN v_nota;
  END IF;

  RETURN v_nota;
END
$function$
