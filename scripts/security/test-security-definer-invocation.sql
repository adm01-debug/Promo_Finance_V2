-- ============================================================================
-- Testes de INVOCAÇÃO em runtime das funções SECURITY DEFINER.
-- Diferente de test-observability-privileges.sql (que valida a ACL estática),
-- este script realmente troca de role via SET LOCAL ROLE e tenta executar
-- a função com argumentos NULL, capturando o SQLSTATE retornado.
--
-- Expectativas:
--   • anon           → deve falhar com SQLSTATE 42501 (insufficient_privilege)
--   • authenticated  → deve falhar com SQLSTATE 42501 (autorização vive em
--                       has_role dentro do corpo; sem EXECUTE bruto, nem chega lá)
--   • service_role   → NÃO deve receber 42501 (qualquer outro erro é aceitável,
--                       pois indica que o gate de permissão foi ultrapassado)
--
-- Roda via: psql -v ON_ERROR_STOP=1 -f scripts/security/test-security-definer-invocation.sql
-- Sai != 0 se qualquer expectativa for violada.
-- ============================================================================
\set ON_ERROR_STOP on
\pset border 2

BEGIN;

-- Mesmas assinaturas do gate de ACL. Mantenha as duas listas sincronizadas.
CREATE TEMP TABLE _targets(fn text, categoria text) ON COMMIT DROP;

INSERT INTO _targets(fn, categoria) VALUES
  ('public.capture_pg_stat_statements_baseline(p_label text)', 'observability'),
  ('public.capture_slow_queries(threshold_ms numeric)',        'observability'),
  ('public.monitor_table_bloat()',                             'observability'),
  ('public.snapshot_table_bloat()',                            'observability'),
  ('public.refresh_performance_alerts_weekly()',               'observability'),
  ('public.sefaz_run_observability_checks()',                  'observability'),
  ('public.nfe_apply_manifestacao(p_chave text, p_tipo_evento text, p_codigo_evento text, p_sequencial integer, p_data_evento timestamp with time zone, p_protocolo text, p_justificativa text, p_status_retorno text, p_motivo_retorno text, p_novo_status nfe_manifestacao_status, p_raw jsonb)', 'nfe'),
  ('public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date, p_categoria_id uuid)', 'nfe'),
  ('public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid)',   'nfe'),
  ('public.nfe_suggest_contas_pagar(p_nfe_id uuid)',                      'nfe'),
  ('public.nfe_unlink_conta_pagar(p_nfe_id uuid)',                        'nfe'),
  ('public.confirmar_conciliacao(p_conciliacao_id uuid, p_user_id uuid, p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)', 'conciliacao'),
  ('public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)', 'conciliacao'),
  ('public.desfazer_conciliacao(p_conciliacao_id uuid, p_transacao_id uuid, p_user_id uuid)', 'conciliacao'),
  ('public.desfazer_conciliacao_manual(p_transacao_id uuid)',                                 'conciliacao'),
  ('public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid)', 'conciliacao');

-- Resolve OIDs e monta chamada com todos os argumentos NULL (força permission
-- check antes de qualquer validação de negócio).
CREATE TEMP TABLE _calls(
  fn text, categoria text, proc_oid oid, call_sql text
) ON COMMIT DROP;

INSERT INTO _calls(fn, categoria, proc_oid, call_sql)
SELECT
  t.fn,
  t.categoria,
  p.oid,
  format(
    'SELECT %I.%I(%s)',
    n.nspname,
    p.proname,
    COALESCE(
      (SELECT string_agg('NULL::' || format_type(unnest_arg, NULL), ', ')
       FROM unnest(p.proargtypes::oid[]) WITH ORDINALITY AS u(unnest_arg, ord)),
      ''
    )
  )
FROM _targets t
JOIN pg_proc p ON true
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE (n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')') = t.fn;

-- Guarda: toda assinatura em _targets precisa resolver para um OID.
DO $$
DECLARE v_missing int;
BEGIN
  SELECT COUNT(*) INTO v_missing
  FROM _targets t
  WHERE NOT EXISTS (SELECT 1 FROM _calls c WHERE c.fn = t.fn);
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Invocation test FAILED: % função(ões) não resolveram OID', v_missing;
  END IF;
END $$;

CREATE TEMP TABLE _invocation_results(
  categoria text, fn text, role_name text,
  sqlstate text, expectation text, status text, message text
) ON COMMIT DROP;

-- Executa cada chamada sob cada role e classifica o resultado.
DO $$
DECLARE
  c RECORD;
  r RECORD;
  v_sqlstate text;
  v_message  text;
  v_status   text;
  v_expect   text;
BEGIN
  FOR c IN SELECT * FROM _calls LOOP
    FOR r IN VALUES ('anon'), ('authenticated'), ('service_role') LOOP
      v_sqlstate := NULL;
      v_message  := NULL;

      BEGIN
        -- Savepoint isola falhas — importantíssimo porque SECURITY DEFINER
        -- funções com escrita podem deixar a transação em estado abortado.
        EXECUTE format('SET LOCAL ROLE %I', r.column1);
        BEGIN
          EXECUTE c.call_sql;
          v_sqlstate := '00000';  -- executou sem erro
        EXCEPTION WHEN OTHERS THEN
          GET STACKED DIAGNOSTICS
            v_sqlstate = RETURNED_SQLSTATE,
            v_message  = MESSAGE_TEXT;
        END;
        RESET ROLE;
      EXCEPTION WHEN OTHERS THEN
        RESET ROLE;
        GET STACKED DIAGNOSTICS
          v_sqlstate = RETURNED_SQLSTATE,
          v_message  = MESSAGE_TEXT;
      END;

      IF r.column1 IN ('anon', 'authenticated') THEN
        v_expect := 'deny(42501)';
        v_status := CASE WHEN v_sqlstate = '42501' THEN 'PASS' ELSE 'FAIL' END;
      ELSE
        v_expect := 'allow(not 42501)';
        v_status := CASE WHEN v_sqlstate <> '42501' THEN 'PASS' ELSE 'FAIL' END;
      END IF;

      INSERT INTO _invocation_results(categoria, fn, role_name, sqlstate, expectation, status, message)
      VALUES (c.categoria, c.fn, r.column1, v_sqlstate, v_expect, v_status, left(COALESCE(v_message, ''), 120));
    END LOOP;
  END LOOP;
END $$;

\echo
\echo '=== Invocação em runtime — SECURITY DEFINER (SET ROLE + tentativa de execução) ==='
SELECT categoria, fn, role_name, sqlstate, expectation, status
FROM _invocation_results
ORDER BY categoria, fn, role_name;

\echo
\echo '=== Falhas detalhadas (se houver) ==='
SELECT categoria, fn, role_name, sqlstate, expectation, message
FROM _invocation_results
WHERE status = 'FAIL'
ORDER BY categoria, fn, role_name;

\echo
\echo '=== Resumo por categoria ==='
SELECT categoria,
  COUNT(*) FILTER (WHERE status = 'PASS') AS pass,
  COUNT(*) FILTER (WHERE status = 'FAIL') AS fail,
  COUNT(*) AS total
FROM _invocation_results
GROUP BY categoria
ORDER BY categoria;

\echo
\echo '=== Resumo geral ==='
SELECT
  COUNT(*) FILTER (WHERE status = 'PASS') AS pass,
  COUNT(*) FILTER (WHERE status = 'FAIL') AS fail,
  COUNT(*) AS total
FROM _invocation_results;

DO $$
DECLARE v_fail INT;
BEGIN
  SELECT COUNT(*) INTO v_fail FROM _invocation_results WHERE status = 'FAIL';
  IF v_fail > 0 THEN
    RAISE EXCEPTION 'Invocation test FAILED: % expectativa(s) violada(s) — ver seção "Falhas detalhadas"', v_fail;
  END IF;
END $$;

\echo '✅ Todas as invocações se comportaram como esperado.'

ROLLBACK;
