-- Fase 4 NFe: RPC transacional para persistir manifestação do destinatário
-- Insere evento e atualiza status da NFe atomicamente + idempotência.
CREATE OR REPLACE FUNCTION public.nfe_apply_manifestacao(
  p_chave TEXT,
  p_tipo_evento TEXT,
  p_codigo_evento TEXT,
  p_sequencial INTEGER,
  p_data_evento TIMESTAMPTZ,
  p_protocolo TEXT,
  p_justificativa TEXT,
  p_status_retorno TEXT,
  p_motivo_retorno TEXT,
  p_novo_status public.nfe_manifestacao_status,
  p_raw JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nfe_id UUID;
  v_status_atual public.nfe_manifestacao_status;
  v_inserted BOOLEAN := FALSE;
BEGIN
  SELECT id, manifestacao_status
    INTO v_nfe_id, v_status_atual
    FROM public.nfe_recebidas
   WHERE chave_acesso = p_chave
   FOR UPDATE;

  IF v_nfe_id IS NULL THEN
    RAISE EXCEPTION 'nfe_nao_encontrada' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.nfe_eventos(
    chave_acesso, tipo_evento, codigo_evento, sequencial,
    data_evento, protocolo, justificativa,
    status_retorno, motivo_retorno, raw_payload, created_by
  ) VALUES (
    p_chave, p_tipo_evento, p_codigo_evento, GREATEST(p_sequencial,1),
    COALESCE(p_data_evento, now()), p_protocolo, p_justificativa,
    p_status_retorno, p_motivo_retorno, p_raw, auth.uid()
  )
  ON CONFLICT (chave_acesso, tipo_evento, sequencial) DO NOTHING
  RETURNING TRUE INTO v_inserted;

  -- Atualiza status apenas se retorno SEFAZ for aceito (135/136/155).
  IF p_status_retorno IN ('135','136','155') THEN
    UPDATE public.nfe_recebidas
       SET manifestacao_status = p_novo_status,
           manifestacao_data = COALESCE(p_data_evento, now()),
           manifestacao_justificativa = p_justificativa,
           updated_at = now()
     WHERE id = v_nfe_id;
  END IF;

  RETURN jsonb_build_object(
    'nfe_id', v_nfe_id,
    'status_anterior', v_status_atual,
    'status_novo', CASE WHEN p_status_retorno IN ('135','136','155')
                        THEN p_novo_status ELSE v_status_atual END,
    'evento_inserido', COALESCE(v_inserted, FALSE)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nfe_apply_manifestacao(
  TEXT, TEXT, TEXT, INTEGER, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT,
  public.nfe_manifestacao_status, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nfe_apply_manifestacao(
  TEXT, TEXT, TEXT, INTEGER, TIMESTAMPTZ, TEXT, TEXT, TEXT, TEXT,
  public.nfe_manifestacao_status, JSONB
) TO service_role;

COMMENT ON FUNCTION public.nfe_apply_manifestacao IS
  'Fase 4 NFe: registra evento de manifestação (Ciência/Confirmação/Desconhecimento/Não realizada) e atualiza status da NFe atomicamente. Idempotente via UNIQUE (chave,tipo,seq).';