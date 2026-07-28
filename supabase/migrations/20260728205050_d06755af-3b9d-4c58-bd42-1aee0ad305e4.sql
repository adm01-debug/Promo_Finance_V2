-- Gap #33 (ajuste): o GRANT de telemetria pré-login precisa ser por coluna.
-- Um GRANT de tabela inteira devolveria a `anon` o controle de `id` e
-- `created_at`, permitindo sequestro de partição e falsificação do carimbo
-- temporal do incidente. O servidor deve ser a única fonte desses dois campos.
REVOKE INSERT ON public.frontend_error_logs FROM anon;

GRANT INSERT (error_message, error_stack, url, user_agent, metadata, severity, user_id)
  ON public.frontend_error_logs TO anon;

DO $$
BEGIN
  IF has_column_privilege('anon', 'public.frontend_error_logs', 'id', 'INSERT')
     OR has_column_privilege('anon', 'public.frontend_error_logs', 'created_at', 'INSERT') THEN
    RAISE EXCEPTION 'FAIL: anon ainda controla id/created_at em frontend_error_logs.';
  END IF;
  IF NOT has_column_privilege('anon', 'public.frontend_error_logs', 'error_message', 'INSERT') THEN
    RAISE EXCEPTION 'FAIL: anon perdeu INSERT em error_message; telemetria pré-login ficaria cega.';
  END IF;
  RAISE NOTICE 'PASS: telemetria anônima restrita às colunas de conteúdo.';
END $$;