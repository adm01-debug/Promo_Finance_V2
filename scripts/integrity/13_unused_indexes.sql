-- 13_unused_indexes.sql — Gate #34: índices ociosos após janela de observação.
--
-- Um índice sem nenhuma leitura ao longo de >= 30 dias corridos de observação
-- (histórico em public.index_usage_snapshots, capturado diariamente pelo cron
-- `capture-index-usage-daily`) só custa escrita, WAL e VACUUM. Índices únicos e
-- de chave primária são ignorados (garantem integridade) e exceções conscientes
-- ficam versionadas em public.indices_uso_excecoes com motivo.
--
-- O gate não falha enquanto a janela ainda não tem 30 dias — evita remover
-- índices recém-criados que ainda não foram exercitados em produção.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH viola AS (
  SELECT tabela, indice, tamanho_kb FROM public.gate_34_indices_nao_utilizados(30)
),
agg AS (
  SELECT count(*) AS n,
         COALESCE(sum(tamanho_kb), 0) AS kb,
         string_agg(tabela || '.' || indice, ', ' ORDER BY tabela, indice) AS list
  FROM viola
)
SELECT 'perf.index_ocioso',
       CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
       '0', n::text,
       CASE WHEN n = 0
            THEN 'nenhum índice ocioso na janela de 30 dias'
            ELSE 'índices sem uso (' || kb::text || ' kB): ' || COALESCE(list, '') END
FROM agg;
