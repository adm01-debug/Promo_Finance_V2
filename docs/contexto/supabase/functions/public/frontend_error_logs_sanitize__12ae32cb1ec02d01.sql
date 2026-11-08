CREATE OR REPLACE FUNCTION public.frontend_error_logs_sanitize()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
