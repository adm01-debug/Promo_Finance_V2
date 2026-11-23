-- Etapa 43 do plano RT/RFB: `registrar_nfe_com_creditos` descartava `origem`
-- e `efeito_tributario`. A migration 20261122022000 adicionou as colunas com
-- default `estimado`/`false`, mas a funcao continuou inserindo uma lista fixa
-- de colunas e nunca leu os campos do payload: todo credito importado de XML
-- ficava gravado como estimado, e sem efeito tributario, mesmo quando o
-- vCBS/vIBS vinha destacado na nota. Isso quebrava o criterio de credito
-- "disponivel" das etapas 44/48/88, que exige efeito_tributario = true E
-- origem = 'xml_destacado'.
--
-- Corpo identico ao de 20260913140000_rpcs_atomicas_fluxos_multi_passo.sql
-- (validacoes de auth, empresa_acessivel, colunas desconhecidas e contagem de
-- linhas preservadas); a unica diferenca e o INSERT dos creditos, que passa a
-- propagar origem, efeito_tributario e ano_fato_gerador.

CREATE OR REPLACE FUNCTION public.registrar_nfe_com_creditos(
  p_empresa_id uuid,
  p_nota jsonb,
  p_creditos jsonb DEFAULT '[]'::jsonb
)
RETURNS public.notas_fiscais
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_nota public.notas_fiscais;
  v_desconhecidas text;
  v_colunas text;
  v_esperados integer := COALESCE(jsonb_array_length(COALESCE(p_creditos, '[]'::jsonb)), 0);
  v_linhas integer;
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

  IF v_esperados = 0 THEN
    RETURN v_nota;
  END IF;

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
      -- A chave do documento precisa ser gravada também nesta via: sem ela, o
      -- reprocessamento (que apaga por `documento_chave`) inseria um segundo
      -- conjunto de créditos para a mesma NF-e e a apuração somava os dois.
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

  RETURN v_nota;
END
$function$;

COMMENT ON FUNCTION public.registrar_nfe_com_creditos(uuid, jsonb, jsonb) IS
  'Cria a nota e seus creditos atomicamente. Propaga origem, efeito_tributario e ano_fato_gerador de cada credito (etapa 43).';