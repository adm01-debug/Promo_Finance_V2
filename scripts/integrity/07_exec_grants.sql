-- 07_exec_grants.sql — Gate #28: superfície de execução das funções SECURITY DEFINER.
--
-- Funções SECURITY DEFINER rodam com privilégios do owner. Qualquer role do
-- app (anon/authenticated) com EXECUTE é superfície de ataque: a função só
-- pode ser exposta se fizer verificação de autorização interna. Este gate
-- compara o conjunto real com a allowlist versionada em
-- baseline/allowed-secdef-exec.json.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH
allow_anon AS (
  SELECT jsonb_array_elements_text(((:'allowed_secdef')::jsonb)->'anon') AS fn
),
allow_auth AS (
  SELECT jsonb_array_elements_text(((:'allowed_secdef')::jsonb)->'authenticated') AS fn
),
secdef AS (
  SELECT p.oid, p.proname::text AS fn, p.prosrc
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef AND p.prokind = 'f'
),
anon_extra AS (
  SELECT string_agg(DISTINCT fn, ',' ORDER BY fn) AS list, count(DISTINCT fn) AS n
  FROM secdef s
  WHERE has_function_privilege('anon', s.oid, 'EXECUTE')
    AND s.fn NOT IN (SELECT fn FROM allow_anon)
),
auth_extra AS (
  SELECT string_agg(DISTINCT fn, ',' ORDER BY fn) AS list, count(DISTINCT fn) AS n
  FROM secdef s
  WHERE has_function_privilege('authenticated', s.oid, 'EXECUTE')
    AND s.fn NOT IN (SELECT fn FROM allow_auth)
),
-- Funções expostas a roles do app precisam de verificação interna de acesso.
sem_guard AS (
  SELECT string_agg(DISTINCT fn, ',' ORDER BY fn) AS list, count(DISTINCT fn) AS n
  FROM secdef s
  WHERE has_function_privilege('authenticated', s.oid, 'EXECUTE')
    AND s.prosrc !~* '(has_role|has_any_role|empresa_acessivel|empresa_membro_ativo|auth\.uid|Acesso negado)'
    -- helpers de identidade e gatilhos são intencionalmente sem guard
    AND s.fn NOT IN ('has_role', 'empresa_padrao_id', 'resolve_sso_providers_for_domain')
    AND pg_get_function_result(s.oid) <> 'trigger'
),
-- Funções de gatilho não devem ter EXECUTE concedido a roles do app.
triggers_expostos AS (
  SELECT string_agg(DISTINCT fn, ',' ORDER BY fn) AS list, count(DISTINCT fn) AS n
  FROM secdef s
  WHERE pg_get_function_result(s.oid) = 'trigger'
    AND (has_function_privilege('anon', s.oid, 'EXECUTE')
      OR has_function_privilege('authenticated', s.oid, 'EXECUTE'))
)
SELECT * FROM (
  SELECT 'secdef.anon_exec_allowlist',
         CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
         '0', n::text,
         CASE WHEN n = 0 THEN 'anon só executa o que está na allowlist'
              ELSE 'fora da allowlist (anon): ' || COALESCE(list, '') END
    FROM anon_extra
  UNION ALL
  SELECT 'secdef.auth_exec_allowlist',
         CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
         '0', n::text,
         CASE WHEN n = 0 THEN 'authenticated só executa o que está na allowlist'
              ELSE 'fora da allowlist (authenticated): ' || COALESCE(list, '') END
    FROM auth_extra
  UNION ALL
  SELECT 'secdef.guard_interno',
         CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
         '0', n::text,
         CASE WHEN n = 0 THEN 'todas as funções expostas verificam autorização'
              ELSE 'sem verificação interna: ' || COALESCE(list, '') END
    FROM sem_guard
  UNION ALL
  SELECT 'secdef.triggers_sem_exec',
         CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
         '0', n::text,
         CASE WHEN n = 0 THEN 'nenhuma trigger function com EXECUTE para app roles'
              ELSE 'trigger exposta: ' || COALESCE(list, '') END
    FROM triggers_expostos
) x;
