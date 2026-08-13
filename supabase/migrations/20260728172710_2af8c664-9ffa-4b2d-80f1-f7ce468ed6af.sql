-- ============================================================================
-- GAP #22b — correção do mecanismo de carimbo de tempo
-- ----------------------------------------------------------------------------
-- FALHA ENCONTRADA NA SIMULAÇÃO (antes de chegar em produção):
--   ERROR: moving row to another partition during a BEFORE FOR EACH ROW
--          trigger is not supported
--
-- Causa: created_at é a CHAVE DE PARTIÇÃO. Reescrevê-la em BEFORE INSERT faz
-- a linha mudar de partição no meio da operação, o que o Postgres proíbe.
-- Efeito real se tivesse passado: qualquer cliente enviando created_at fora
-- do mês corrente derrubaria o INSERT inteiro — e como a telemetria envia em
-- lote, UM registro malformado descartaria o lote todo de erros.
--
-- Solução correta e mais forte: em vez de corrigir o valor depois, remover do
-- cliente o direito de informá-lo. GRANT em nível de COLUNA faz o PostgREST
-- rejeitar a coluna na origem, e o DEFAULT now() do servidor sempre vence.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.frontend_error_logs_sanitize()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- NÃO tocar em NEW.created_at: é chave de partição e reescrevê-la aqui é
  -- proibido pelo Postgres. A imutabilidade é garantida pelo GRANT por coluna
  -- abaixo, que impede o cliente de sequer enviar o campo.
  NEW.error_message := left(NEW.error_message, 2000);
  NEW.error_stack   := left(NEW.error_stack,   8000);
  NEW.url           := left(NEW.url,           2000);
  NEW.user_agent    := left(NEW.user_agent,     500);

  IF NEW.severity IS NULL OR NEW.severity NOT IN ('error', 'warning', 'critical') THEN
    NEW.severity := 'error';
  END IF;

  IF pg_column_size(coalesce(NEW.metadata, '{}'::jsonb)) > 16384 THEN
    NEW.metadata := jsonb_build_object(
      '_truncated', true,
      '_original_bytes', pg_column_size(NEW.metadata)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Privilégio de escrita restrito às colunas que o cliente legitimamente
-- preenche. `id` e `created_at` passam a ser exclusividade do servidor.
REVOKE INSERT ON public.frontend_error_logs FROM anon, authenticated;

GRANT INSERT (user_id, error_message, error_stack, url, user_agent, severity, metadata)
  ON public.frontend_error_logs TO authenticated;
GRANT INSERT (user_id, error_message, error_stack, url, user_agent, severity, metadata)
  ON public.frontend_error_logs TO anon;

-- Logs de erro são append-only para o cliente, como a trilha de auditoria.
REVOKE UPDATE, DELETE, TRUNCATE ON public.frontend_error_logs FROM anon, authenticated;
GRANT ALL ON public.frontend_error_logs TO service_role;