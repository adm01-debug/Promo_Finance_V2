-- Função: cleanup_log_tables
-- Descrição: Remove registros antigos de tabelas de log conforme política de retenção.
-- Segurança: SECURITY DEFINER (advisory lock previne execução concorrente)
-- Grants: service_role
-- Agendamento: pg_cron 'daily-log-retention' — 03:00 UTC diariamente
-- Última migration: 20260711153640

-- Fonte canônica versionada. A definição vigente no banco é a última migration
-- aplicada; este arquivo serve como referência de code review.

CREATE OR REPLACE FUNCTION public.cleanup_log_tables()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $$
-- Ver migration 20260711153640 para corpo completo.
BEGIN
  RETURN '{}'::jsonb;
END;
$$;
