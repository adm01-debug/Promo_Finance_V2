-- ============================================================================
-- Testa privilégios EXECUTE das funções SECURITY DEFINER de observabilidade.
-- Roda via: psql -f scripts/security/test-observability-privileges.sql
-- Retorna FAIL/PASS por função e sai com código != 0 se algum FAIL.
-- ============================================================================
\set ON_ERROR_STOP on
\pset border 2

BEGIN;

-- Funções que devem ser bloqueadas para anon/PUBLIC e liberadas para service_role.
CREATE TEMP TABLE _targets(fn text) ON COMMIT DROP;
INSERT INTO _targets(fn) VALUES
  ('public.capture_pg_stat_statements_baseline(text)'),
  ('public.capture_slow_queries(numeric)'),
  ('public.monitor_table_bloat()'),
  ('public.snapshot_table_bloat()'),
  ('public.refresh_performance_alerts_weekly()'),
  ('public.sefaz_run_observability_checks()');

-- Matriz esperada: (role, deve_executar?)
CREATE TEMP TABLE _expected(role_name text, expected boolean) ON COMMIT DROP;
INSERT INTO _expected VALUES
  ('anon',          false),
  ('PUBLIC',        false),
  ('service_role',  true);

CREATE TEMP TABLE _results(
  fn text, role_name text, expected boolean, actual boolean, status text
) ON COMMIT DROP;

INSERT INTO _results(fn, role_name, expected, actual, status)
SELECT
  t.fn,
  e.role_name,
  e.expected,
  has_function_privilege(e.role_name, t.fn, 'EXECUTE') AS actual,
  CASE
    WHEN has_function_privilege(e.role_name, t.fn, 'EXECUTE') = e.expected
      THEN 'PASS'
    ELSE 'FAIL'
  END
FROM _targets t
CROSS JOIN _expected e;

\echo
\echo '=== Privilégios EXECUTE — funções de observabilidade ==='
SELECT fn, role_name, expected, actual, status FROM _results ORDER BY fn, role_name;

\echo
\echo '=== Resumo ==='
SELECT
  COUNT(*) FILTER (WHERE status = 'PASS') AS pass,
  COUNT(*) FILTER (WHERE status = 'FAIL') AS fail,
  COUNT(*) AS total
FROM _results;

-- Falha o script se houver qualquer FAIL.
DO $$
DECLARE v_fail INT;
BEGIN
  SELECT COUNT(*) INTO v_fail FROM _results WHERE status = 'FAIL';
  IF v_fail > 0 THEN
    RAISE EXCEPTION 'Security test FAILED: % privilégio(s) divergente(s)', v_fail;
  END IF;
END $$;

\echo '✅ Todos os privilégios estão conforme esperado.'

COMMIT;
