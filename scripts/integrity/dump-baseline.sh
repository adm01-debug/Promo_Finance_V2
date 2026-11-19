#!/usr/bin/env bash
# dump-baseline.sh — Regera baselines JSON a partir de PROD_DB_URL.
# Grava em scripts/integrity/baseline/. NUNCA escreve em produção.
set -euo pipefail

: "${PROD_DB_URL:?PROD_DB_URL obrigatório}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$DIR/baseline"
mkdir -p "$OUT"

# Gera numa pasta temporária e só publica no fim: redirecionar direto para
# baseline/*.json truncava o arquivo versionado antes de o psql responder, e
# uma falha de conexão deixava "{}" / arquivo vazio no lugar do baseline.
TMP="$(mktemp -d "$OUT/.dump.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

# --- schema-counts.json ----------------------------------------------------
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t -F , <<'SQL' \
  | awk -F, 'BEGIN{printf "{"} {printf "%s\"%s\":%s", (NR>1?",":""), $1, $2} END{print "}"}' \
  > "$TMP/schema-counts.json"
SELECT 'tables',    count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r';
SELECT 'views',     count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='v';
SELECT 'indexes',   count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='i';
SELECT 'functions', count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public';
SELECT 'policies',  count(*) FROM pg_policies WHERE schemaname='public';
SQL

# --- expected-policies.json (contagem por tabela) --------------------------
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t <<'SQL' > "$TMP/expected-policies.json"
SELECT COALESCE(jsonb_object_agg(tablename, cnt), '{}'::jsonb)::text FROM (
  SELECT tablename, count(*) AS cnt FROM pg_policies
  WHERE schemaname='public' GROUP BY tablename
) t;
SQL

# --- expected-crons.json ---------------------------------------------------
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t <<'SQL' > "$TMP/expected-crons.json"
SELECT COALESCE(jsonb_agg(jsonb_build_object('jobname', jobname, 'schedule', schedule)
       ORDER BY jobname), '[]'::jsonb)::text
FROM cron.job WHERE active = true;
SQL

# psql pode sair com 0 sem devolver linha (resposta vazia): não publicar isso.
grep -q '"tables":[0-9]' "$TMP/schema-counts.json" \
  || { echo "❌ schema-counts.json sem contagens — baseline preservado" >&2; exit 1; }
for f in expected-policies.json expected-crons.json; do
  [ -s "$TMP/$f" ] || { echo "❌ $f vazio — baseline preservado" >&2; exit 1; }
done
mv -f "$TMP/schema-counts.json" "$TMP/expected-policies.json" "$TMP/expected-crons.json" "$OUT/"

# --- allowed-public-tables.json --------------------------------------------
# Preserva a whitelist manual — nunca sobrescreve se já existir.
if [ ! -f "$OUT/allowed-public-tables.json" ]; then
  echo '[]' > "$OUT/allowed-public-tables.json"
fi

# --- allowed-anon-writes.json ----------------------------------------------
# Excecoes explicitas de escrita para anon (formato "tabela:PRIVILEGE").
# Preservada manualmente - nunca sobrescreve se ja existir.
if [ ! -f "$OUT/allowed-anon-writes.json" ]; then
  echo '[]' > "$OUT/allowed-anon-writes.json"
fi

echo "✅ baselines atualizados em $OUT"
