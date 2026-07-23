
-- Trigger updated_at para nfe_recebidas (idempotente)
DROP TRIGGER IF EXISTS trg_nfe_recebidas_updated_at ON public.nfe_recebidas;
CREATE TRIGGER trg_nfe_recebidas_updated_at
BEFORE UPDATE ON public.nfe_recebidas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC defesa em profundidade: cursor jamais regride
CREATE OR REPLACE FUNCTION public.sefaz_cursor_advance(
  p_cnpj TEXT,
  p_ambiente public.sefaz_ambiente,
  p_novo_nsu BIGINT,
  p_max_nsu BIGINT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_erro TEXT DEFAULT NULL
) RETURNS TABLE(ultimo_nsu BIGINT, advanced BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_prev BIGINT;
  v_advanced BOOLEAN := false;
BEGIN
  INSERT INTO public.sefaz_dfe_cursor (cnpj, ambiente, ultimo_nsu, max_nsu, ultima_consulta, ultimo_status, ultimo_erro)
  VALUES (p_cnpj, p_ambiente, GREATEST(p_novo_nsu, 0), COALESCE(p_max_nsu, p_novo_nsu), now(), p_status, p_erro)
  ON CONFLICT (cnpj, ambiente) DO NOTHING;

  SELECT c.ultimo_nsu INTO v_prev
  FROM public.sefaz_dfe_cursor c
  WHERE c.cnpj = p_cnpj AND c.ambiente = p_ambiente
  FOR UPDATE;

  IF p_novo_nsu > COALESCE(v_prev, 0) THEN
    UPDATE public.sefaz_dfe_cursor
      SET ultimo_nsu = p_novo_nsu,
          max_nsu = GREATEST(COALESCE(max_nsu, 0), COALESCE(p_max_nsu, p_novo_nsu)),
          ultima_consulta = now(),
          ultimo_status = COALESCE(p_status, ultimo_status),
          ultimo_erro = p_erro,
          retry_count = 0,
          last_error_at = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
          updated_at = now()
      WHERE cnpj = p_cnpj AND ambiente = p_ambiente;
    v_advanced := true;
  ELSE
    UPDATE public.sefaz_dfe_cursor
      SET ultima_consulta = now(),
          ultimo_status = COALESCE(p_status, ultimo_status),
          ultimo_erro = p_erro,
          last_error_at = CASE WHEN p_erro IS NULL THEN last_error_at ELSE now() END,
          updated_at = now()
      WHERE cnpj = p_cnpj AND ambiente = p_ambiente;
  END IF;

  RETURN QUERY SELECT COALESCE(v_prev, p_novo_nsu, 0), v_advanced;
END;
$$;

REVOKE ALL ON FUNCTION public.sefaz_cursor_advance(TEXT, public.sefaz_ambiente, BIGINT, BIGINT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sefaz_cursor_advance(TEXT, public.sefaz_ambiente, BIGINT, BIGINT, TEXT, TEXT) TO service_role, authenticated;
