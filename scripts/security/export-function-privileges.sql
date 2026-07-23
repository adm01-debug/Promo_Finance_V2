-- ============================================================================
-- Gera resumo de privilégios EXECUTE (função × role) em CSV e JSON.
-- Uso local:  psql -v out_dir=/mnt/documents/security -f scripts/security/export-function-privileges.sql
-- Uso em CI:  psql -v out_dir=./artifacts/security   -f scripts/security/export-function-privileges.sql
--
-- Emite dois arquivos no diretório apontado por :out_dir
--   • function-privileges.csv  (linha por fn × role)
--   • function-privileges.json (agregado por função)
-- ============================================================================
\set ON_ERROR_STOP on
\pset pager off

-- Diretório de saída (default: /mnt/documents/security)
\if :{?out_dir}
\else
  \set out_dir '/mnt/documents/security'
\endif

\echo Diretório de saída: :out_dir

BEGIN;

-- Reaproveita mesma lista de funções alvo dos gates de segurança.
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

CREATE TEMP TABLE _resolved(
  fn text, categoria text, proc_oid oid, schema_name text, fn_name text,
  identity_args text, security_definer boolean, owner_name text
) ON COMMIT DROP;

INSERT INTO _resolved
SELECT
  t.fn, t.categoria, p.oid, n.nspname, p.proname,
  pg_get_function_identity_arguments(p.oid),
  p.prosecdef,
  pg_get_userbyid(p.proowner)
FROM _targets t
JOIN pg_proc p ON true
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE (n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')') = t.fn;

-- Snapshot da matriz de privilégios: 3 roles nominais + PUBLIC.
CREATE TEMP TABLE _matrix(
  categoria text, fn text, schema_name text, fn_name text, identity_args text,
  security_definer boolean, owner_name text,
  role_name text, has_execute boolean
) ON COMMIT DROP;

INSERT INTO _matrix
SELECT
  r.categoria, r.fn, r.schema_name, r.fn_name, r.identity_args,
  r.security_definer, r.owner_name,
  role_name,
  CASE
    WHEN role_name = 'PUBLIC' THEN EXISTS (
      SELECT 1 FROM pg_proc p,
      LATERAL unnest(COALESCE(p.proacl, acldefault('f', p.proowner))) AS acl(item)
      WHERE p.oid = r.proc_oid AND acl.item::text LIKE '=X%'
    )
    ELSE has_function_privilege(role_name, r.proc_oid, 'EXECUTE')
  END
FROM _resolved r
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role'), ('PUBLIC')) AS roles(role_name);

-- Exporta CSV linha-a-linha.
\echo Escrevendo CSV...
\set csv_path :out_dir '/function-privileges.csv'
\o /dev/null
SELECT pg_catalog.set_config('client_min_messages', 'warning', false);
\o

-- Cria diretório de saída (requer psql \! shell escape)
\set mkdir_cmd 'mkdir -p ' :'out_dir'
\! sh -c "$0" :"mkdir_cmd"

\copy (SELECT categoria, fn, schema_name, fn_name, identity_args, security_definer, owner_name, role_name, has_execute FROM _matrix ORDER BY categoria, fn, role_name) TO PROGRAM 'cat > "$0/function-privileges.csv"' :"out_dir" WITH CSV HEADER

-- Exporta JSON agregado (uma entrada por função, com sub-objeto de roles).
\copy (SELECT jsonb_pretty(jsonb_build_object('generated_at', now(), 'total_functions', (SELECT COUNT(DISTINCT fn) FROM _matrix), 'functions', jsonb_agg(fn_entry ORDER BY fn_entry->>'categoria', fn_entry->>'fn'))) FROM (SELECT jsonb_build_object('categoria', categoria, 'fn', fn, 'schema', schema_name, 'name', fn_name, 'identity_args', identity_args, 'security_definer', security_definer, 'owner', owner_name, 'privileges', jsonb_object_agg(role_name, has_execute)) AS fn_entry FROM _matrix GROUP BY categoria, fn, schema_name, fn_name, identity_args, security_definer, owner_name) sub) TO PROGRAM 'cat > "$0/function-privileges.json"' :"out_dir"

\echo
\echo '=== Resumo por categoria × role ==='
SELECT categoria, role_name,
  COUNT(*) FILTER (WHERE has_execute)     AS with_execute,
  COUNT(*) FILTER (WHERE NOT has_execute) AS denied,
  COUNT(*) AS total
FROM _matrix
GROUP BY categoria, role_name
ORDER BY categoria, role_name;

\echo
\echo '✅ Arquivos gerados em' :out_dir

ROLLBACK;
