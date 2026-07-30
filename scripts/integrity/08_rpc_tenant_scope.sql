-- 08_rpc_tenant_scope.sql — Gate #29: escopo por empresa nas RPCs privilegiadas.
--
-- Uma função SECURITY DEFINER ignora RLS. Se ela lê uma tabela que tem
-- empresa_id e não aplica filtro de tenant (empresa_acessivel / empresa_id =),
-- qualquer usuário autorizado por papel enxerga dados de TODAS as empresas —
-- exatamente o vazamento que as policies por tenant fecharam.
--
-- Exceções intencionais ficam na lista NOT IN da função canônica
-- public.gate_29_rpc_sem_escopo_empresa(), versionada por migration.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH viola AS (
  SELECT funcao, tabelas FROM public.gate_29_rpc_sem_escopo_empresa()
),
agg AS (
  SELECT count(*) AS n,
         string_agg(funcao || ' (' || tabelas || ')', '; ' ORDER BY funcao) AS list
  FROM viola
)
SELECT 'rpc.tenant_scope',
       CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
       '0', n::text,
       CASE WHEN n = 0
            THEN 'toda RPC SECURITY DEFINER que lê tabela com empresa_id aplica filtro de tenant'
            ELSE 'RPC sem escopo de empresa: ' || COALESCE(list, '') END
FROM agg;
