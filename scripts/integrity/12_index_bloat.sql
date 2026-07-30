-- 12_index_bloat.sql — Gate #33: índices redundantes.
--
-- Índices duplicados (mesmas colunas, opclass e predicado de outro índice, em
-- especial de uma constraint UNIQUE/PK) não trazem ganho de leitura e custam
-- em cada INSERT/UPDATE/DELETE, além de inflar o WAL e o tempo de VACUUM.
-- Este gate falha quando um índice redundante é reintroduzido.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH viola AS (
  SELECT tabela, indice_redundante FROM public.gate_33_indices_redundantes()
),
agg AS (
  SELECT count(*) AS n,
         string_agg(tabela || '.' || indice_redundante, ', ' ORDER BY tabela, indice_redundante) AS list
  FROM viola
)
SELECT 'perf.index_redundante',
       CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
       '0', n::text,
       CASE WHEN n = 0
            THEN 'nenhum índice redundante no schema public'
            ELSE 'índices redundantes: ' || COALESCE(list, '') END
FROM agg;
