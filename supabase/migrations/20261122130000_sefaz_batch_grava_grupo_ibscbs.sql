-- Etapa 49 do plano RT/RFB: o puxador SEFAZ passou a extrair o grupo IBS/CBS
-- das NF-e recebidas (`procNFe`) e a enviá-lo em `raw_metadata`, mas o
-- `sefaz_process_batch` descartava o campo na lista de colunas do INSERT —
-- o grupo chegava na Edge Function e morria no banco.
--
-- Só `procNFe` (XML completo) produz o grupo; `resNFe` (resumo) não tem itens
-- nem impostos, então continua gravando `raw_metadata = null` e nunca gera
-- crédito. Corpo idêntico ao vigente (20260831153000), com a única diferença
-- sendo a coluna `raw_metadata` e o valor correspondente.

CREATE OR REPLACE FUNCTION public.sefaz_process_batch(
  p_cnpj text,
  p_ambiente text,
  p_empresa_id uuid,
  p_novo_nsu bigint,
  p_max_nsu bigint,
  p_status text,
  p_erro text,
  p_docs jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cursor_atual bigint;
  v_doc jsonb;
  v_payload jsonb;
  v_kind text;
  v_novos integer := 0;
  v_eventos integer := 0;
  v_ignorados integer := 0;
  v_inserted_id uuid;
BEGIN
  SELECT ultimo_nsu
    INTO v_cursor_atual
  FROM public.sefaz_dfe_cursor
  WHERE cnpj = p_cnpj
    AND ambiente = p_ambiente::public.sefaz_ambiente
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.sefaz_dfe_cursor (
      cnpj, ambiente, ultimo_nsu, max_nsu,
      retry_count, next_run_at, circuit_open
    )
    VALUES (
      p_cnpj, p_ambiente::public.sefaz_ambiente, 0, 0,
      0, now(), false
    )
    RETURNING ultimo_nsu INTO v_cursor_atual;
  END IF;

  IF p_docs IS NOT NULL AND jsonb_typeof(p_docs) = 'array' THEN
    FOR v_doc IN SELECT * FROM jsonb_array_elements(p_docs)
    LOOP
      v_kind := v_doc->>'kind';
      v_payload := v_doc->'payload';

      IF v_kind = 'nfe' THEN
        INSERT INTO public.nfe_recebidas (
          empresa_id, chave_acesso, cnpj_emitente, razao_emitente, ie_emitente,
          uf_emitente, cnpj_destinatario, numero, serie, modelo, data_emissao,
          valor_total, digest_value, tipo_documento, schema_tipo, nsu, ambiente,
          xml_path, xml_completo, raw_metadata
        )
        VALUES (
          p_empresa_id,
          v_payload->>'chave_acesso',
          v_payload->>'cnpj_emitente',
          v_payload->>'razao_emitente',
          v_payload->>'ie_emitente',
          v_payload->>'uf_emitente',
          v_payload->>'cnpj_destinatario',
          v_payload->>'numero',
          v_payload->>'serie',
          v_payload->>'modelo',
          nullif(v_payload->>'data_emissao', '')::timestamptz,
          nullif(v_payload->>'valor_total', '')::numeric,
          v_payload->>'digest_value',
          v_payload->>'tipo_documento',
          (v_payload->>'schema_tipo')::public.nfe_schema_tipo,
          (v_doc->>'nsu')::bigint,
          p_ambiente::public.sefaz_ambiente,
          v_payload->>'xml_path',
          coalesce((v_payload->>'xml_completo')::boolean, true),
          -- Etapa 49: grupo IBS/CBS extraído do XML completo (null em resNFe).
          nullif(v_payload->'raw_metadata', 'null'::jsonb)
        )
        ON CONFLICT (chave_acesso) DO NOTHING
        RETURNING id INTO v_inserted_id;

        IF v_inserted_id IS NOT NULL THEN
          v_novos := v_novos + 1;
        ELSE
          v_ignorados := v_ignorados + 1;
        END IF;
        v_inserted_id := NULL;
      ELSIF v_kind = 'evento' THEN
        INSERT INTO public.nfe_eventos (
          chave_acesso, tipo_evento, codigo_evento, sequencial,
          data_evento, protocolo, justificativa, status_retorno, motivo_retorno
        )
        VALUES (
          v_payload->>'chave_acesso',
          v_payload->>'tipo_evento',
          v_payload->>'codigo_evento',
          coalesce((v_payload->>'sequencial')::integer, 1),
          coalesce(nullif(v_payload->>'data_evento', '')::timestamptz, now()),
          v_payload->>'protocolo',
          v_payload->>'justificativa',
          v_payload->>'status_retorno',
          v_payload->>'motivo_retorno'
        )
        ON CONFLICT (chave_acesso, tipo_evento, sequencial) DO NOTHING
        RETURNING id INTO v_inserted_id;

        IF v_inserted_id IS NOT NULL THEN
          v_eventos := v_eventos + 1;
        ELSE
          v_ignorados := v_ignorados + 1;
        END IF;
        v_inserted_id := NULL;
      ELSE
        RAISE EXCEPTION 'sefaz_process_batch: kind desconhecido "%"', v_kind;
      END IF;
    END LOOP;
  END IF;

  IF p_novo_nsu > v_cursor_atual THEN
    UPDATE public.sefaz_dfe_cursor
       SET ultimo_nsu = p_novo_nsu,
           max_nsu = greatest(max_nsu, coalesce(p_max_nsu, max_nsu)),
           ultimo_status = p_status,
           ultimo_erro = p_erro,
           ultima_consulta = now(),
           retry_count = CASE WHEN p_erro IS NULL THEN 0 ELSE retry_count END,
           last_error_at = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
           updated_at = now()
     WHERE cnpj = p_cnpj
       AND ambiente = p_ambiente::public.sefaz_ambiente;
  ELSE
    UPDATE public.sefaz_dfe_cursor
       SET ultimo_status = p_status,
           ultimo_erro = p_erro,
           ultima_consulta = now(),
           last_error_at = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
           updated_at = now()
     WHERE cnpj = p_cnpj
       AND ambiente = p_ambiente::public.sefaz_ambiente;
  END IF;

  RETURN jsonb_build_object(
    'cursor_antes', v_cursor_atual,
    'cursor_depois', greatest(v_cursor_atual, p_novo_nsu),
    'novos', v_novos,
    'eventos', v_eventos,
    'ignorados', v_ignorados
  );
END
$function$;

