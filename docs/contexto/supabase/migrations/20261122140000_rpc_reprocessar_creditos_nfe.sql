-- Etapa 50 do plano RT/RFB: RPC idempotente de regravação do crédito de uma
-- NF-e recebida a partir do grupo IBS/CBS do próprio XML.
--
-- Por que a troca é destrutiva e transacional: o crédito de uma nota pode
-- estar hoje como `estimado` (calculado por alíquota quando não havia grupo).
-- Regravar por cima somaria dois créditos para o mesmo documento fiscal —
-- exatamente o tipo de erro que só aparece na apuração. Ou a nota troca o
-- conjunto inteiro de créditos, ou não muda nada.
--
-- Idempotência é garantida pela chave: DELETE por `documento_chave` (ou pelo
-- `nota_fiscal_id` da nota equivalente) seguido de INSERT. Rodar N vezes
-- produz o mesmo estado de rodar 1 vez. Crédito já utilizado/compensado não é
-- reescrito — o RPC falha com `credito_ja_utilizado`.
--
-- `SECURITY DEFINER` + `service_role` only: quem chama é o job de
-- reprocessamento; nada de usuário final escolhendo crédito de empresa alheia.

CREATE OR REPLACE FUNCTION public.reprocessar_creditos_nfe(
  p_chave_acesso text,
  p_creditos jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_nota public.nfe_recebidas%ROWTYPE;
  v_nota_fiscal_id uuid;
  v_inseridos integer := 0;
  v_removidos integer := 0;
BEGIN
  IF p_chave_acesso IS NULL OR length(p_chave_acesso) <> 44 THEN
    RAISE EXCEPTION 'chave_acesso invalida: %', p_chave_acesso
      USING ERRCODE = '22023';
  END IF;

  IF p_creditos IS NULL OR jsonb_typeof(p_creditos) <> 'array' THEN
    RAISE EXCEPTION 'creditos devem ser um array jsonb'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_nota FROM public.nfe_recebidas WHERE chave_acesso = p_chave_acesso;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'nfe_nao_encontrada: %', p_chave_acesso
      USING ERRCODE = 'P0002';
  END IF;

  -- Nota equivalente no módulo de notas emitidas/importadas: a importação
  -- manual de XML grava créditos vinculados por `nota_fiscal_id`, sem a chave
  -- do documento. Sem considerá-la aqui, o reprocessamento inseriria um
  -- segundo conjunto de créditos para o mesmo documento fiscal e a apuração
  -- somaria os dois.
  SELECT nf.id
    INTO v_nota_fiscal_id
  FROM public.notas_fiscais nf
  WHERE nf.empresa_id = v_nota.empresa_id
    AND nf.chave_acesso = p_chave_acesso
  LIMIT 1;

  -- Crédito já realizado (utilizado/compensado) é fato tributário consumado:
  -- regravá-lo apagaria o histórico do que já entrou na apuração. Nesse caso
  -- a nota é preservada e o chamador é avisado em vez de reescrever por cima.
  IF EXISTS (
    SELECT 1 FROM public.creditos_tributarios
     WHERE empresa_id IS NOT DISTINCT FROM v_nota.empresa_id
       AND (
         documento_chave = p_chave_acesso
         OR (v_nota_fiscal_id IS NOT NULL AND nota_fiscal_id = v_nota_fiscal_id)
       )
       AND status NOT IN ('disponivel', 'estornado')
  ) THEN
    RAISE EXCEPTION 'credito_ja_utilizado: %', p_chave_acesso
      USING ERRCODE = '23505';
  END IF;

  -- Troca atômica: remove o conjunto anterior do mesmo documento e grava o novo.
  DELETE FROM public.creditos_tributarios
   WHERE empresa_id IS NOT DISTINCT FROM v_nota.empresa_id
     AND (
       documento_chave = p_chave_acesso
       OR (v_nota_fiscal_id IS NOT NULL AND nota_fiscal_id = v_nota_fiscal_id)
     );
  GET DIAGNOSTICS v_removidos = ROW_COUNT;

  INSERT INTO public.creditos_tributarios (
    empresa_id, nota_fiscal_id, tipo_tributo, valor_credito, saldo_disponivel,
    data_origem, competencia_origem, status, origem, efeito_tributario,
    ano_fato_gerador, documento_chave, documento_tipo, documento_numero,
    fornecedor_cnpj, fornecedor_nome
  )
  SELECT
    v_nota.empresa_id,
    v_nota_fiscal_id,
    c.tipo_tributo,
    c.valor_credito,
    COALESCE(c.saldo_disponivel, 0),
    c.data_origem,
    c.competencia_origem,
    COALESCE(c.status, 'disponivel'),
    COALESCE(c.origem, 'xml_destacado'::public.origem_credito_tributario),
    COALESCE(c.efeito_tributario, false),
    c.ano_fato_gerador,
    p_chave_acesso,
    'nfe',
    v_nota.numero,
    v_nota.cnpj_emitente,
    v_nota.razao_emitente
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
  GET DIAGNOSTICS v_inseridos = ROW_COUNT;

  -- Falha alto em vez de deixar a nota sem crédito: o DELETE já rodou, então
  -- silenciar aqui apagaria crédito do contribuinte sem substituí-lo.
  IF v_inseridos <> COALESCE(jsonb_array_length(p_creditos), 0) THEN
    RAISE EXCEPTION 'creditos_nao_gravados: % de %', v_inseridos, jsonb_array_length(p_creditos)
      USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'chave_acesso', p_chave_acesso,
    'removidos', v_removidos,
    'inseridos', v_inseridos
  );
END
$function$

COMMENT ON FUNCTION public.reprocessar_creditos_nfe(text, jsonb) IS
  'Etapa 50: troca o conjunto de creditos de uma NF-e recebida pelo grupo IBS/CBS do proprio XML. Idempotente por chave_acesso.'

-- Somente service_role: o job de reprocessamento e o unico chamador legitimo.
REVOKE ALL ON FUNCTION public.reprocessar_creditos_nfe(text, jsonb) FROM PUBLIC

REVOKE ALL ON FUNCTION public.reprocessar_creditos_nfe(text, jsonb) FROM anon

REVOKE ALL ON FUNCTION public.reprocessar_creditos_nfe(text, jsonb) FROM authenticated

GRANT EXECUTE ON FUNCTION public.reprocessar_creditos_nfe(text, jsonb) TO service_role
