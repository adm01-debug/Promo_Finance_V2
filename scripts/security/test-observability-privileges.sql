-- ============================================================================
-- Testa privilégios EXECUTE das funções SECURITY DEFINER de
-- observabilidade, NF-e e conciliação bancária.

-- Roda via: psql -f scripts/security/test-observability-privileges.sql
-- Retorna FAIL/PASS por função e sai com código != 0 se algum FAIL.
-- ============================================================================
\set ON_ERROR_STOP on
\pset border 2

BEGIN;

-- Funções que devem ser bloqueadas para anon/PUBLIC/authenticated e liberadas
-- apenas para service_role (authenticated pode receber acesso via has_role no
-- corpo da função, mas o GRANT EXECUTE bruto deve permanecer negado).
CREATE TEMP TABLE _targets(fn text, categoria text) ON COMMIT DROP;

-- Observabilidade / performance
INSERT INTO _targets(fn, categoria) VALUES
  ('public.capture_pg_stat_statements_baseline(p_label text)', 'observability'),
  ('public.capture_slow_queries(threshold_ms numeric)',        'observability'),

  ('public.monitor_table_bloat()',                            'observability'),
  ('public.snapshot_table_bloat()',                           'observability'),
  ('public.refresh_performance_alerts_weekly()',              'observability'),
  ('public.sefaz_run_observability_checks()',                 'observability');

-- NF-e (SECURITY DEFINER): manifestação e vínculo financeiro
INSERT INTO _targets(fn, categoria) VALUES
  ('public.nfe_apply_manifestacao(p_chave text, p_tipo_evento text, p_codigo_evento text, p_sequencial integer, p_data_evento timestamp with time zone, p_protocolo text, p_justificativa text, p_status_retorno text, p_motivo_retorno text, p_novo_status nfe_manifestacao_status, p_raw jsonb)', 'nfe'),
  ('public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date, p_categoria_id uuid)', 'nfe'),
  ('public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid)',   'nfe'),
  ('public.nfe_suggest_contas_pagar(p_nfe_id uuid)',                      'nfe'),
  ('public.nfe_unlink_conta_pagar(p_nfe_id uuid)',                        'nfe');

-- Conciliação bancária (SECURITY DEFINER): confirmar/desfazer/sugestões
INSERT INTO _targets(fn, categoria) VALUES
  ('public.confirmar_conciliacao(p_conciliacao_id uuid, p_user_id uuid, p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)', 'conciliacao'),
  ('public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)', 'conciliacao'),
  ('public.desfazer_conciliacao(p_conciliacao_id uuid, p_transacao_id uuid, p_user_id uuid)',                                             'conciliacao'),
  ('public.desfazer_conciliacao_manual(p_transacao_id uuid)',                                                                             'conciliacao'),
  ('public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid)', 'conciliacao');

-- Guarda: garante que todas as funções alvo existem no banco (evita falso PASS
-- caso uma função seja renomeada/removida e o teste passe a validar o vazio).
DO $$
DECLARE r RECORD; v_missing INT := 0;
BEGIN
  FOR r IN SELECT fn FROM _targets LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE (n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')') = r.fn
    ) THEN
      RAISE WARNING 'Função alvo não encontrada: %', r.fn;
      v_missing := v_missing + 1;
    END IF;
  END LOOP;
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Security test FAILED: % função(ões) alvo ausente(s) — atualizar assinaturas em _targets', v_missing;
  END IF;
END $$;

-- Resolve OIDs uma única vez (has_function_privilege exige assinatura por tipos,
-- não a forma nome+tipo devolvida por pg_get_function_identity_arguments em
-- algumas versões do Postgres). Trabalhar por OID elimina essa fragilidade.
CREATE TEMP TABLE _targets_resolved(fn text, categoria text, proc_oid oid) ON COMMIT DROP;
INSERT INTO _targets_resolved(fn, categoria, proc_oid)
SELECT t.fn, t.categoria, p.oid
FROM _targets t
JOIN pg_proc p ON true
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE (n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')') = t.fn;

-- Matriz esperada: (role, deve_executar?). 'PUBLIC' é tratado à parte via proacl.
CREATE TEMP TABLE _expected(role_name text, expected boolean) ON COMMIT DROP;
INSERT INTO _expected VALUES
  ('anon',          false),
  ('authenticated', false),  -- sem role admin no user_roles
  ('service_role',  true);

CREATE TEMP TABLE _results(
  categoria text, fn text, role_name text, expected boolean, actual boolean, status text
) ON COMMIT DROP;

INSERT INTO _results(categoria, fn, role_name, expected, actual, status)
SELECT
  t.categoria,
  t.fn,
  e.role_name,
  e.expected,
  has_function_privilege(e.role_name, t.proc_oid, 'EXECUTE') AS actual,
  CASE
    WHEN has_function_privilege(e.role_name, t.proc_oid, 'EXECUTE') = e.expected
      THEN 'PASS'
    ELSE 'FAIL'
  END
FROM _targets_resolved t
CROSS JOIN _expected e;

-- Adicionalmente, verifica PUBLIC (grantee vazio na proacl → EXECUTE herdado).
INSERT INTO _results(categoria, fn, role_name, expected, actual, status)
SELECT
  t.categoria,
  t.fn,
  'PUBLIC',
  false AS expected,
  EXISTS (
    SELECT 1
    FROM pg_proc p,
    LATERAL unnest(COALESCE(p.proacl, acldefault('f', p.proowner))) AS acl(item)
    WHERE p.oid = t.proc_oid AND acl.item::text LIKE '=X%'
  ) AS actual,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_proc p,
      LATERAL unnest(COALESCE(p.proacl, acldefault('f', p.proowner))) AS acl(item)
      WHERE p.oid = t.proc_oid AND acl.item::text LIKE '=X%'
    ) = false THEN 'PASS' ELSE 'FAIL'
  END
FROM _targets_resolved t;

FROM _targets t;

\echo
\echo '=== Privilégios EXECUTE — observabilidade / NF-e / conciliação ==='
SELECT categoria, fn, role_name, expected, actual, status
FROM _results
ORDER BY categoria, fn, role_name;

\echo
\echo '=== Resumo por categoria ==='
SELECT
  categoria,
  COUNT(*) FILTER (WHERE status = 'PASS') AS pass,
  COUNT(*) FILTER (WHERE status = 'FAIL') AS fail,
  COUNT(*) AS total
FROM _results
GROUP BY categoria
ORDER BY categoria;

\echo
\echo '=== Resumo geral ==='
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
