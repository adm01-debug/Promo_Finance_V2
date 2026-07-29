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
# Preferimos ler cron.job direto; se o papel não tiver acesso ao schema `cron`,
# caímos para a RPC pública get_cron_jobs() (exige papel admin).
if ! psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t <<'SQL' > "$OUT/expected-crons.json" 2>/dev/null
SELECT COALESCE(jsonb_agg(jsonb_build_object('jobname', jobname, 'schedule', schedule)
       ORDER BY jobname), '[]'::jsonb)::text
FROM cron.job WHERE active = true;
SQL
then
  psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t <<'SQL' > "$OUT/expected-crons.json"
SELECT COALESCE(jsonb_agg(jsonb_build_object('jobname', j.jobname, 'schedule', j.schedule)
       ORDER BY j.jobname), '[]'::jsonb)::text
FROM public.get_cron_jobs() j WHERE j.active;
SQL
fi

# --- allowed-public-tables.json --------------------------------------------
# Preserva a whitelist manual — nunca sobrescreve se já existir.
if [ ! -f "$OUT/allowed-public-tables.json" ]; then
  echo '[]' > "$OUT/allowed-public-tables.json"
fi

# --- Validação final --------------------------------------------------------
for f in schema-counts.json expected-policies.json expected-crons.json allowed-public-tables.json; do
  jq -e . "$OUT/$f" >/dev/null || { echo "ERRO: $f inválido" >&2; exit 1; }
done

echo "✅ baselines atualizados em $OUT"
