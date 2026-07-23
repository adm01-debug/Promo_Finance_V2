-- ============================================================================
-- Testa privilégios EXECUTE das funções SECURITY DEFINER de
-- observabilidade, NF-e e conciliação bancária.
--
-- Roda via: psql -f scripts/security/test-observability-privileges.sql
-- Retorna FAIL/PASS por função e sai com código != 0 se algum FAIL.
--
-- EXCEÇÕES CONTROLADAS (_exceptions):
--   Lista as funções que legitimamente ainda mantêm EXECUTE para
--   `authenticated` (ex.: consumidas via .rpc() diretamente pelo frontend).
--   Cada exceção exige:
--     - motivo (comentário curto, humano)
--     - data de expiração (após essa data, o teste falha e força revisão)
--   Meta: zerar essa lista migrando os consumidores para Edge Functions
--   com service_role (padrão aplicado a nfe_vinculo-proxy / conciliacao-proxy).
-- ============================================================================
\set ON_ERROR_STOP on
\pset border 2

BEGIN;

-- Funções que devem ser bloqueadas para anon/PUBLIC/authenticated e liberadas
-- apenas para service_role (authenticated pode receber acesso via has_role no
-- corpo da função, mas o GRANT EXECUTE bruto deve permanecer negado — exceto
-- quando listado em _exceptions abaixo).
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

-- ----------------------------------------------------------------------------
-- EXCEÇÕES CONTROLADAS
-- ----------------------------------------------------------------------------
-- Formato: (fn, role_name, motivo, expira_em DATE)
-- Enquanto a data de expiração for futura, o teste ESPERA que a role tenha
-- EXECUTE. Após a expiração, a exceção é ignorada e o teste volta a exigir
-- revogação — forçando a migração ou renovação explícita.
CREATE TEMP TABLE _exceptions(
  fn text,
  role_name text,
  motivo text,
  expira_em date
) ON COMMIT DROP;

INSERT INTO _exceptions(fn, role_name, motivo, expira_em) VALUES
  -- NF-e: migradas para Edge Function `nfe-vinculo-proxy` (service_role).
  -- GRANT antigo mantido temporariamente até rollout do proxy em produção.
  ('public.nfe_suggest_contas_pagar(p_nfe_id uuid)',
   'authenticated', 'Migrado para nfe-vinculo-proxy; revogar após rollout', DATE '2026-08-31'),
  ('public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid)',
   'authenticated', 'Migrado para nfe-vinculo-proxy; revogar após rollout', DATE '2026-08-31'),
  ('public.nfe_unlink_conta_pagar(p_nfe_id uuid)',
   'authenticated', 'Migrado para nfe-vinculo-proxy; revogar após rollout', DATE '2026-08-31'),
  ('public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date, p_categoria_id uuid)',
   'authenticated', 'Migrado para nfe-vinculo-proxy; revogar após rollout', DATE '2026-08-31'),

  -- Conciliação: RPCs manuais migradas para `conciliacao-proxy` (service_role).
  ('public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)',
   'authenticated', 'Migrado para conciliacao-proxy; revogar após rollout', DATE '2026-08-31'),
  ('public.desfazer_conciliacao_manual(p_transacao_id uuid)',
   'authenticated', 'Migrado para conciliacao-proxy; revogar após rollout', DATE '2026-08-31'),

  -- Conciliação: RPCs legadas ainda consumidas por fluxos administrativos.
  -- Proteção efetiva vem de has_role no corpo (default-deny) — plano é migrar
  -- para o mesmo proxy até a data abaixo.
  ('public.confirmar_conciliacao(p_conciliacao_id uuid, p_user_id uuid, p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric)',
   'authenticated', 'Fluxo legado; migrar para conciliacao-proxy', DATE '2026-10-31'),
  ('public.desfazer_conciliacao(p_conciliacao_id uuid, p_transacao_id uuid, p_user_id uuid)',
   'authenticated', 'Fluxo legado; migrar para conciliacao-proxy', DATE '2026-10-31'),
  ('public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid)',
   'authenticated', 'Sugestões IA consumidas pelo painel; migrar para proxy', DATE '2026-10-31');

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

-- Guarda: exceções devem apontar para funções listadas em _targets.
DO $$
DECLARE r RECORD; v_missing INT := 0;
BEGIN
  FOR r IN SELECT fn FROM _exceptions e WHERE NOT EXISTS (SELECT 1 FROM _targets t WHERE t.fn = e.fn) LOOP
    RAISE WARNING 'Exceção referencia função fora de _targets: %', r.fn;
    v_missing := v_missing + 1;
  END LOOP;
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Security test FAILED: exceção(ões) com assinatura inválida em _exceptions';
  END IF;
END $$;

-- Aviso amigável: exceções expiradas ou prestes a expirar (30 dias).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT fn, role_name, expira_em FROM _exceptions
           WHERE expira_em <= CURRENT_DATE + INTERVAL '30 days'
           ORDER BY expira_em LOOP
    IF r.expira_em < CURRENT_DATE THEN
      RAISE WARNING 'Exceção EXPIRADA (%): % [%] — será tratada como divergência', r.expira_em, r.fn, r.role_name;
    ELSE
      RAISE NOTICE 'Exceção expira em % — %: % [%]', r.expira_em, (r.expira_em - CURRENT_DATE), r.fn, r.role_name;
    END IF;
  END LOOP;
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

-- Matriz base: (role, deve_executar?). 'PUBLIC' é tratado à parte via proacl.
CREATE TEMP TABLE _expected_base(role_name text, expected boolean) ON COMMIT DROP;
INSERT INTO _expected_base VALUES
  ('anon',          false),
  ('authenticated', false),
  ('service_role',  true);

-- Matriz final aplicando exceções ativas (não expiradas).
CREATE TEMP TABLE _expected(fn text, role_name text, expected boolean, motivo text) ON COMMIT DROP;
INSERT INTO _expected(fn, role_name, expected, motivo)
SELECT
  t.fn,
  e.role_name,
  CASE
    WHEN x.fn IS NOT NULL AND x.expira_em >= CURRENT_DATE THEN true
    ELSE e.expected
  END,
  x.motivo
FROM _targets_resolved t
CROSS JOIN _expected_base e
LEFT JOIN _exceptions x
  ON x.fn = t.fn AND x.role_name = e.role_name;

CREATE TEMP TABLE _results(
  categoria text, fn text, role_name text, expected boolean, actual boolean,
  status text, motivo text
) ON COMMIT DROP;

INSERT INTO _results(categoria, fn, role_name, expected, actual, status, motivo)
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
  END,
  e.motivo
FROM _targets_resolved t
JOIN _expected e ON e.fn = t.fn;

-- Adicionalmente, verifica PUBLIC (grantee vazio na proacl → EXECUTE herdado).
-- PUBLIC nunca é aceito em exceções — sempre deve ser negado.
INSERT INTO _results(categoria, fn, role_name, expected, actual, status, motivo)
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
  END,
  NULL
FROM _targets_resolved t;

\echo
\echo '=== Exceções controladas ativas ==='
SELECT fn, role_name, motivo, expira_em,
       (expira_em - CURRENT_DATE) AS dias_restantes
FROM _exceptions
ORDER BY expira_em, fn;

\echo
\echo '=== Privilégios EXECUTE — observabilidade / NF-e / conciliação ==='
SELECT categoria, fn, role_name, expected, actual, status,
       COALESCE(motivo, '') AS motivo_excecao
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

\echo '✅ Todos os privilégios estão conforme esperado (exceções controladas aplicadas).'

COMMIT;
