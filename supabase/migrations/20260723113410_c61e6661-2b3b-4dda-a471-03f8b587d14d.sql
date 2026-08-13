
-- 1) Unicidade em nfe_eventos para idempotência de reprocessamento
CREATE UNIQUE INDEX IF NOT EXISTS nfe_eventos_chave_tipo_seq_uk
  ON public.nfe_eventos (chave_acesso, tipo_evento, sequencial);

-- 2) RPC transacional: aplica batch inteiro OU nada.
-- Estrutura esperada em p_docs (jsonb array):
--   { kind: 'nfe' | 'evento', nsu: bigint, payload: {...} }
-- payload para 'nfe' contém as colunas de nfe_recebidas (exceto empresa_id/ambiente/nsu).
-- payload para 'evento' contém colunas de nfe_eventos.
CREATE OR REPLACE FUNCTION public.sefaz_process_batch(
  p_cnpj         TEXT,
  p_ambiente     TEXT,
  p_empresa_id   UUID,
  p_novo_nsu     BIGINT,
  p_max_nsu      BIGINT,
  p_status       TEXT,
  p_erro         TEXT,
  p_docs         JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cursor_atual BIGINT;
  v_doc          JSONB;
  v_payload      JSONB;
  v_kind         TEXT;
  v_novos        INT := 0;
  v_eventos      INT := 0;
  v_ignorados    INT := 0;
  v_inserted_id  UUID;
BEGIN
  -- Lock do cursor por (cnpj, ambiente) para serializar processamentos concorrentes.
  SELECT ultimo_nsu INTO v_cursor_atual
  FROM public.sefaz_dfe_cursor
  WHERE cnpj = p_cnpj AND ambiente = p_ambiente::ambiente_sefaz
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.sefaz_dfe_cursor (cnpj, ambiente, ultimo_nsu, max_nsu, retry_count, next_run_at, circuit_open)
    VALUES (p_cnpj, p_ambiente::ambiente_sefaz, 0, 0, 0, now(), false)
    RETURNING ultimo_nsu INTO v_cursor_atual;
  END IF;

  -- Processa docs (upsert idempotente por chave/evento).
  IF p_docs IS NOT NULL AND jsonb_typeof(p_docs) = 'array' THEN
    FOR v_doc IN SELECT * FROM jsonb_array_elements(p_docs)
    LOOP
      v_kind    := v_doc->>'kind';
      v_payload := v_doc->'payload';

      IF v_kind = 'nfe' THEN
        INSERT INTO public.nfe_recebidas (
          empresa_id, chave_acesso, cnpj_emitente, razao_emitente, ie_emitente, uf_emitente,
          cnpj_destinatario, numero, serie, modelo, data_emissao, valor_total,
          digest_value, tipo_documento, schema_tipo, nsu, ambiente,
          xml_path, xml_completo
        ) VALUES (
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
          NULLIF(v_payload->>'data_emissao','')::timestamptz,
          NULLIF(v_payload->>'valor_total','')::numeric,
          v_payload->>'digest_value',
          v_payload->>'tipo_documento',
          (v_payload->>'schema_tipo')::nfe_schema_tipo,
          (v_doc->>'nsu')::bigint,
          p_ambiente::ambiente_sefaz,
          v_payload->>'xml_path',
          COALESCE((v_payload->>'xml_completo')::boolean, true)
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
          data_evento, protocolo, justificativa,
          status_retorno, motivo_retorno
        ) VALUES (
          v_payload->>'chave_acesso',
          v_payload->>'tipo_evento',
          v_payload->>'codigo_evento',
          COALESCE((v_payload->>'sequencial')::int, 1),
          COALESCE(NULLIF(v_payload->>'data_evento','')::timestamptz, now()),
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

  -- Cursor NUNCA regride. Só avança se novo NSU > atual.
  IF p_novo_nsu > v_cursor_atual THEN
    UPDATE public.sefaz_dfe_cursor
       SET ultimo_nsu     = p_novo_nsu,
           max_nsu        = GREATEST(max_nsu, COALESCE(p_max_nsu, max_nsu)),
           ultimo_status  = p_status,
           ultimo_erro    = p_erro,
           ultima_consulta= now(),
           retry_count    = CASE WHEN p_erro IS NULL THEN 0 ELSE retry_count END,
           last_error_at  = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
           updated_at     = now()
     WHERE cnpj = p_cnpj AND ambiente = p_ambiente::ambiente_sefaz;
  ELSE
    -- Sem avanço: apenas registra status/erro (útil para rate_limit, empty, etc.)
    UPDATE public.sefaz_dfe_cursor
       SET ultimo_status  = p_status,
           ultimo_erro    = p_erro,
           ultima_consulta= now(),
           last_error_at  = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
           updated_at     = now()
     WHERE cnpj = p_cnpj AND ambiente = p_ambiente::ambiente_sefaz;
  END IF;

  RETURN jsonb_build_object(
    'cursor_antes',    v_cursor_atual,
    'cursor_depois',   GREATEST(v_cursor_atual, p_novo_nsu),
    'novos',           v_novos,
    'eventos',         v_eventos,
    'ignorados',       v_ignorados
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sefaz_process_batch(TEXT,TEXT,UUID,BIGINT,BIGINT,TEXT,TEXT,JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sefaz_process_batch(TEXT,TEXT,UUID,BIGINT,BIGINT,TEXT,TEXT,JSONB) TO service_role;
