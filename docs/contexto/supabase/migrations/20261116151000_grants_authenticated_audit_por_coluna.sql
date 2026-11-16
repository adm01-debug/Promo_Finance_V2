-- 20261116151000 — Reaplica os GRANTs de authenticated perdidos por drift,
-- preservando a restrição POR COLUNA da telemetria de frontend.
--
-- Supersede a migration da PR #348, que concedia `INSERT` de TABELA em
-- frontend_error_logs. Isso desfaria 20260728172710 e 20260728205050, que
-- revogaram o INSERT amplo justamente para que `id` e `created_at` fossem
-- exclusividade do servidor — o trigger frontend_error_logs_sanitize() só
-- trunca texto e normaliza metadata, não sobrescreve esses dois campos, então
-- um cliente autenticado passaria a carimbar a própria data no log de erro.
--
-- Estado verificado em prod antes desta migration (role authenticated):
--   information_schema.role_table_grants   -> 0 linhas
--   information_schema.column_privileges   -> 0 linhas
-- Ou seja: as três tabelas estão sem nenhum GRANT, o que produz o 403 em
-- /rest/v1/audit_logs relatado na PR #349.
--
-- audit_logs e planos_acao não têm (nem tiveram) restrição por coluna: o
-- endurecimento vigente de audit_logs (20260728172037:46) concede INSERT de
-- tabela de propósito, mantendo a trilha append-only via REVOKE de
-- UPDATE/DELETE/TRUNCATE.

GRANT SELECT, INSERT ON public.audit_logs TO authenticated

REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM authenticated

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos_acao TO authenticated

-- Telemetria de frontend: leitura ampla, escrita só nas colunas de conteúdo.
GRANT SELECT ON public.frontend_error_logs TO authenticated

REVOKE INSERT ON public.frontend_error_logs FROM authenticated

GRANT INSERT (error_message, error_stack, url, user_agent, metadata, severity, user_id)
  ON public.frontend_error_logs TO authenticated

REVOKE UPDATE, DELETE, TRUNCATE ON public.frontend_error_logs FROM authenticated

DO $$
BEGIN
  IF has_column_privilege('authenticated', 'public.frontend_error_logs', 'id', 'INSERT')
     OR has_column_privilege('authenticated', 'public.frontend_error_logs', 'created_at', 'INSERT') THEN
    RAISE EXCEPTION 'FAIL: authenticated ainda controla id/created_at em frontend_error_logs.';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.frontend_error_logs', 'error_message', 'INSERT') THEN
    RAISE EXCEPTION 'FAIL: authenticated perdeu INSERT em error_message; telemetria ficaria cega.';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.audit_logs', 'INSERT') THEN
    RAISE EXCEPTION 'FAIL: authenticated sem INSERT em audit_logs; app volta a receber 403.';
  END IF;
  RAISE NOTICE 'PASS: GRANTs reaplicados com id/created_at da telemetria fechados ao cliente.';
END $$
