-- Função: gate_35_tabelas_sem_retencao
-- Descrição: Aponta tabelas log-like (com coluna temporal) sem política
--            declarada em public.retencao_politicas.
-- Segurança: SECURITY DEFINER, search_path fixo, EXECUTE apenas service_role.
-- Consumidores: scripts/integrity/14_retencao.sql (Gate #35 no CI)
--
-- Regra de governança
-- -------------------
-- Toda tabela cujo nome case com o padrão de log/histórico/telemetria e que
-- possua ao menos uma coluna temporal precisa de UMA das duas coisas em
-- public.retencao_politicas:
--   * TTL:      dias >= 1 e coluna temporal preenchida;
--   * isenção:  dias IS NULL, coluna IS NULL e `motivo` explicando o porquê.
-- A CHECK constraint retencao_politicas_coerencia impede estados ambíguos.
--
-- Partições (`*_2026_07`) e a partição default nomeada (`*_default`) são
-- ignoradas: quem carrega a política é a tabela pai (ou, no caso do overflow,
-- a própria `_default`, registrada explicitamente).
--
-- Fonte canônica versionada. A definição vigente é a da última migration.

CREATE OR REPLACE FUNCTION public.gate_35_tabelas_sem_retencao()
RETURNS TABLE (tabela text, coluna_temporal text, tamanho text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $$
  -- Ver migration de Gate #35 para o corpo completo.
  SELECT NULL::text, NULL::text, NULL::text WHERE false;
$$;
