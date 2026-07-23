#!/usr/bin/env bash
# ==============================================================================
# Gera resumo de privilégios EXECUTE (função × role) em CSV e JSON.
# Uso local:  scripts/security/export-function-privileges.sh
# Uso em CI:  OUT_DIR=./artifacts/security scripts/security/export-function-privileges.sh
#
# Requer PG* no ambiente (PGHOST/PGUSER/…) OU DATABASE_URL.
# ==============================================================================
set -euo pipefail

OUT_DIR="${OUT_DIR:-/mnt/documents/security}"
mkdir -p "$OUT_DIR"

PSQL=(psql -v ON_ERROR_STOP=1 -X -q)
if [[ -n "${DATABASE_URL:-}" ]]; then
  PSQL+=("$DATABASE_URL")
fi

# Bloco que popula uma TEMP TABLE _matrix reutilizada pelas duas exportações.
# Mantém sincronia com scripts/security/test-*.sql (mesma lista de alvos).
read -r -d '' BUILD_MATRIX <<'SQL' || true
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

CREATE TEMP TABLE _resolved AS
SELECT t.fn, t.categoria, p.oid AS proc_oid, n.nspname AS schema_name,
       p.proname AS fn_name, pg_get_function_identity_arguments(p.oid) AS identity_args,
       p.prosecdef AS security_definer, pg_get_userbyid(p.proowner) AS owner_name
FROM _targets t
JOIN pg_proc p ON true
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE (n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')') = t.fn;

-- Guarda: falso PASS se alguém renomear/remover função sem atualizar o script.
DO $$
DECLARE v_missing int;
BEGIN
  SELECT COUNT(*) INTO v_missing FROM _targets t
  WHERE NOT EXISTS (SELECT 1 FROM _resolved r WHERE r.fn = t.fn);
  IF v_missing > 0 THEN
    RAISE EXCEPTION 'export FAILED: % função(ões) alvo não encontradas', v_missing;
  END IF;
END $$;

CREATE TEMP TABLE _matrix AS
SELECT r.categoria, r.fn, r.schema_name, r.fn_name, r.identity_args,
       r.security_definer, r.owner_name, role_name,
       CASE
         WHEN role_name = 'PUBLIC' THEN EXISTS (
           SELECT 1 FROM pg_proc p,
           LATERAL unnest(COALESCE(p.proacl, acldefault('f', p.proowner))) AS acl(item)
           WHERE p.oid = r.proc_oid AND acl.item::text LIKE '=X%'
         )
         ELSE has_function_privilege(role_name, r.proc_oid, 'EXECUTE')
       END AS has_execute
FROM _resolved r
CROSS JOIN (VALUES ('anon'),('authenticated'),('service_role'),('PUBLIC')) AS roles(role_name);
SQL

# --- CSV -----------------------------------------------------------------------
"${PSQL[@]}" -c "BEGIN; ${BUILD_MATRIX}
COPY (
  SELECT categoria, fn, schema_name, fn_name, identity_args,
         security_definer, owner_name, role_name, has_execute
  FROM _matrix
  ORDER BY categoria, fn, role_name
) TO STDOUT WITH CSV HEADER;
ROLLBACK;" > "$OUT_DIR/function-privileges.csv"

# --- JSON ----------------------------------------------------------------------
"${PSQL[@]}" -A -t -c "BEGIN; ${BUILD_MATRIX}
SELECT jsonb_pretty(jsonb_build_object(
  'generated_at', now(),
  'total_functions', (SELECT COUNT(DISTINCT fn) FROM _matrix),
  'functions', jsonb_agg(fn_entry ORDER BY fn_entry->>'categoria', fn_entry->>'fn')
))
FROM (
  SELECT jsonb_build_object(
    'categoria', categoria, 'fn', fn, 'schema', schema_name, 'name', fn_name,
    'identity_args', identity_args, 'security_definer', security_definer,
    'owner', owner_name,
    'privileges', jsonb_object_agg(role_name, has_execute)
  ) AS fn_entry
  FROM _matrix
  GROUP BY categoria, fn, schema_name, fn_name, identity_args, security_definer, owner_name
) sub;
ROLLBACK;" > "$OUT_DIR/function-privileges.json"

# --- Resumo (stdout) -----------------------------------------------------------
echo "=== Resumo por categoria × role ==="
"${PSQL[@]}" -c "BEGIN; ${BUILD_MATRIX}
SELECT categoria, role_name,
  COUNT(*) FILTER (WHERE has_execute)     AS with_execute,
  COUNT(*) FILTER (WHERE NOT has_execute) AS denied,
  COUNT(*) AS total
FROM _matrix GROUP BY categoria, role_name
ORDER BY categoria, role_name;
ROLLBACK;"

echo
echo "✅ Arquivos gerados:"
ls -la "$OUT_DIR"/function-privileges.{csv,json}
