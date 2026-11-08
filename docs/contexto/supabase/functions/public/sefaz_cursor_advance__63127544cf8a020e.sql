CREATE OR REPLACE FUNCTION public.sefaz_cursor_advance(p_cnpj text, p_ambiente sefaz_ambiente, p_novo_nsu bigint, p_max_nsu bigint DEFAULT NULL::bigint, p_status text DEFAULT NULL::text, p_erro text DEFAULT NULL::text)
 RETURNS TABLE(ultimo_nsu bigint, advanced boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
$function$
