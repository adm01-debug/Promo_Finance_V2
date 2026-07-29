-- 10_tenant_indexes.sql — Gate #31: índices de tenant nas tabelas com RLS.
--
-- Cada policy por tenant injeta um predicado `empresa_id = ...` em TODA query.
-- Sem um índice liderado por `empresa_id`, o planner cai em seq scan por
-- tabela inteira e o custo cresce com o número total de empresas — degradando
-- o sistema justamente quando a base multi-tenant cresce.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH viola AS (
  SELECT tabela FROM public.gate_31_tenant_sem_indice()
),
agg AS (
  SELECT count(*) AS n, string_agg(tabela, ', ' ORDER BY tabela) AS list FROM viola
)
SELECT 'tenant.indexes',
       CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
       '0', n::text,
       CASE WHEN n = 0
            THEN 'toda tabela com RLS por empresa_id possui índice liderado por empresa_id'
            ELSE 'tabelas sem índice de tenant: ' || COALESCE(list, '') END
FROM agg;
