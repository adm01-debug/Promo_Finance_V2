#!/usr/bin/env bash
# dump-baseline.sh — Regera baselines JSON a partir de PROD_DB_URL.
# Grava em scripts/integrity/baseline/. NUNCA escreve em produção.
set -euo pipefail

: "${PROD_DB_URL:?PROD_DB_URL obrigatório}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$DIR/baseline"
mkdir -p "$OUT"

# --- schema-counts.json ----------------------------------------------------
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t -F , <<'SQL' \
  | awk -F, 'BEGIN{printf "{"} {printf "%s\"%s\":%s", (NR>1?",":""), $1, $2} END{print "}"}' \
  > "$OUT/schema-counts.json"
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
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t <<'SQL' > "$OUT/expected-policies.json"
SELECT jsonb_object_agg(tablename, cnt)::text FROM (
  SELECT tablename, count(*) AS cnt FROM pg_policies
  WHERE schemaname='public' GROUP BY tablename
) t;
SQL

# --- expected-crons.json ---------------------------------------------------
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t <<'SQL' > "$OUT/expected-crons.json"
SELECT COALESCE(jsonb_agg(jsonb_build_object('jobname', jobname, 'schedule', schedule)
       ORDER BY jobname), '[]'::jsonb)::text
FROM cron.job WHERE active = true;
SQL

# --- allowed-public-tables.json --------------------------------------------
# Preserva a whitelist manual — nunca sobrescreve se já existir.
if [ ! -f "$OUT/allowed-public-tables.json" ]; then
  echo '[]' > "$OUT/allowed-public-tables.json"
fi

echo "✅ baselines atualizados em $OUT"
