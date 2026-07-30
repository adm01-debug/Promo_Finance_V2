-- 14_retencao.sql — Gate #35: governança de retenção de dados.
--
-- Toda tabela de log/histórico/telemetria com coluna temporal precisa de uma
-- política declarada em public.retencao_politicas — seja um TTL em dias, seja
-- uma isenção justificada (dias IS NULL + motivo). Sem isso o crescimento é
-- silencioso: a tabela só aparece quando o disco ou o autovacuum reclamam.
--
-- Três assertions:
--   1. nenhuma tabela log-like sem política;
--   2. nenhuma política incoerente (TTL sem coluna temporal válida na tabela);
--   3. o job diário de retenção executou com sucesso nas últimas 48h.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH sem_politica AS (
  SELECT count(*) AS n,
         string_agg(tabela, ', ' ORDER BY tabela) AS list
  FROM public.gate_35_tabelas_sem_retencao()
),
-- Política aponta para coluna que não existe (ou não é temporal) na tabela.
politica_quebrada AS (
  SELECT count(*) AS n,
         string_agg(p.tabela, ', ' ORDER BY p.tabela) AS list
  FROM public.retencao_politicas p
  WHERE p.ativo
    AND p.dias IS NOT NULL
    AND to_regclass(p.tabela) IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_attribute a
      JOIN pg_type t ON t.oid = a.atttypid
      WHERE a.attrelid = to_regclass(p.tabela)
        AND a.attname = p.coluna
        AND a.attnum > 0
        AND NOT a.attisdropped
        AND t.typname IN ('timestamptz','timestamp','date')
    )
),
-- O gate só cobra execução recente se já houver histórico do job.
execucao AS (
  SELECT
    count(*) FILTER (
      WHERE job_name = 'daily-log-retention'
        AND success
        AND executed_at > now() - interval '48 hours'
    ) AS ok,
    count(*) FILTER (WHERE job_name = 'daily-log-retention') AS total
  FROM public.cron_job_logs
)
SELECT * FROM (
  SELECT 'retencao.toda_tabela_log_tem_politica',
         CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
         '0', n::text,
         CASE WHEN n = 0
              THEN 'todas as tabelas log-like possuem política'
              ELSE 'sem política de retenção: ' || COALESCE(list, '') END
    FROM sem_politica
  UNION ALL
  SELECT 'retencao.politicas_coerentes',
         CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
         '0', n::text,
         CASE WHEN n = 0
              THEN 'todas as políticas apontam para coluna temporal existente'
              ELSE 'coluna temporal inválida em: ' || COALESCE(list, '') END
    FROM politica_quebrada
  UNION ALL
  SELECT 'retencao.job_diario_recente',
         CASE WHEN total = 0 THEN 'unverified'
              WHEN ok > 0 THEN 'pass'
              ELSE 'fail' END,
         '>=1', ok::text,
         CASE WHEN total = 0
              THEN 'sem histórico de daily-log-retention neste ambiente'
              WHEN ok > 0 THEN 'retenção executada com sucesso nas últimas 48h'
              ELSE 'daily-log-retention não concluiu com sucesso nas últimas 48h' END
    FROM execucao
) x;
