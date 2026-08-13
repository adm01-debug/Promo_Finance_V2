-- Gap #25: o probe HTTP anônimo do CI insere um "canário" em frontend_error_logs
-- para provar que a escrita de telemetria segue funcionando. Esse canário não
-- deve poluir o painel administrativo nem disparar alertas proativos (Gap #24).
CREATE OR REPLACE FUNCTION public.frontend_error_logs_sanitize()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Canário do gate de segurança: aceita a requisição (prova o privilégio de
  -- INSERT) mas descarta a linha, mantendo a base limpa.
  IF NEW.error_message IS NOT NULL
     AND NEW.error_message LIKE '[ci-anon-surface-probe]%' THEN
    RETURN NULL;
  END IF;

  -- Truncamento defensivo: mantém os payloads dentro dos limites do CHECK
  -- frontend_error_logs_payload_bounds em vez de rejeitar a telemetria.
  NEW.error_message := left(NEW.error_message, 2000);
  NEW.error_stack   := left(NEW.error_stack, 8000);
  NEW.url           := left(NEW.url, 2000);
  NEW.user_agent    := left(NEW.user_agent, 500);

  IF NEW.metadata IS NULL THEN
    NEW.metadata := '{}'::jsonb;
  ELSIF pg_column_size(NEW.metadata) > 16384 THEN
    NEW.metadata := jsonb_build_object(
      'truncated', true,
      'original_size_bytes', pg_column_size(NEW.metadata)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Limpa canários já gravados durante a validação do probe.
DELETE FROM public.frontend_error_logs
WHERE error_message LIKE '[ci-anon-surface-probe]%'
   OR (error_message IS NULL AND url IS NULL AND user_id IS NULL);