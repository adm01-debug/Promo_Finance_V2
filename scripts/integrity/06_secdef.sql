-- 06_secdef.sql — Gate #27: funções SECURITY DEFINER com search_path fixo.
--
-- Funções SECURITY DEFINER executam com os privilégios do owner. Sem
-- `SET search_path` explícito, um schema controlado pelo chamador pode
-- sequestrar a resolução de nomes (search_path hijacking) e escalar
-- privilégios. Este gate falha se qualquer função SECURITY DEFINER no schema
-- public estiver sem search_path fixo, ou se o search_path apontar para
-- schemas graváveis por roles não privilegiadas.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH
secdef AS (
  SELECT
    p.oid,
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS args,
    (
      SELECT c FROM unnest(COALESCE(p.proconfig, '{}'::text[])) c
      WHERE c LIKE 'search_path=%' LIMIT 1
    ) AS sp
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND p.prokind = 'f'
),
sem_search_path AS (
  SELECT string_agg(proname || '(' || args || ')', ',' ORDER BY proname) AS list,
         count(*) AS n
  FROM secdef WHERE sp IS NULL
),
-- search_path que inclui schemas mutáveis/perigosos para SECURITY DEFINER.
search_path_inseguro AS (
  SELECT string_agg(proname || '=>' || sp, ',' ORDER BY proname) AS list,
         count(*) AS n
  FROM secdef
  WHERE sp IS NOT NULL
    AND (
      sp ~* '(^|[=,\s])"?\$user"?([,\s]|$)'
      OR sp ~* '(^|[=,\s])public\s*,\s*"?\$user"?'
    )
),
totais AS (
  SELECT (SELECT count(*) FROM secdef) AS n_secdef
)
SELECT * FROM (
  SELECT 'secdef.total_functions',
         CASE WHEN n_secdef > 0 THEN 'pass' ELSE 'unverified' END,
         '>0', n_secdef::text,
         'total de funções SECURITY DEFINER em public'
    FROM totais
  UNION ALL
  SELECT 'secdef.search_path_fixo',
         CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
         '0', n::text,
         CASE WHEN n = 0 THEN 'todas com SET search_path'
              ELSE 'sem search_path: ' || COALESCE(list, '') END
    FROM sem_search_path
  UNION ALL
  SELECT 'secdef.search_path_seguro',
         CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
         '0', n::text,
         CASE WHEN n = 0 THEN 'nenhum search_path com $user'
              ELSE 'search_path inseguro: ' || COALESCE(list, '') END
    FROM search_path_inseguro
) x;
