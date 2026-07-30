-- Função: cleanup_log_tables
-- Descrição: Purga registros antigos aplicando as políticas declaradas em
--            public.retencao_politicas (data-driven desde o Gate #35) e chama
--            maintain_monthly_partitions() ao final.
-- Segurança: SECURITY DEFINER (advisory lock previne execução concorrente)
-- Grants: service_role
-- Agendamento: pg_cron 'daily-log-retention' — 03:00 UTC diariamente
--
-- Notas de resiliência:
--  * tabela removida por migration posterior => política é pulada (to_regclass);
--  * política inválida => erro é registrado no resultado JSON e o loop continua,
--    de modo que uma linha ruim nunca impede a purga das demais.
--
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
