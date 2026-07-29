#!/usr/bin/env bash
# integrity/run.sh — Executa 01→05 em ordem, agrega JSONL e falha com exit code
# igual ao número de assertions em fail.
#
# Env: STAGING_DB_URL, STAGING_PROJECT_REF, STAGING_ANON_KEY, TEST_ADMIN_JWT?
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASELINE="$DIR/baseline"
JSON_ONLY=0
[ "${1:-}" = "--json-only" ] && JSON_ONLY=1

: "${STAGING_DB_URL:?STAGING_DB_URL obrigatório}"
: "${STAGING_PROJECT_REF:?STAGING_PROJECT_REF obrigatório}"
: "${STAGING_ANON_KEY:?STAGING_ANON_KEY obrigatório}"

# --- Guard anti-vacuidade ---------------------------------------------------
# Baselines vazios fazem as assertions passarem sem comparar nada. Falha cedo
# em vez de declarar "aprovado" com um baseline placeholder.
# `allowed-public-tables.json` é whitelist manual e pode ser legitimamente [].
for bf in schema-counts.json expected-policies.json; do
  f="$BASELINE/$bf"
  if [ ! -s "$f" ] || ! jq -e '(type=="object" and (length>0)) or (type=="array" and (length>0))' "$f" >/dev/null 2>&1; then
    echo "ERRO: baseline '$bf' ausente ou vazio — regere com scripts/integrity/dump-baseline.sh" >&2
    exit 1
  fi
done
if ! jq -e 'type=="array"' "$BASELINE/expected-crons.json" >/dev/null 2>&1; then
  echo "ERRO: baseline 'expected-crons.json' inválido" >&2
  exit 1
fi



TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
OUT="$TMP/out.jsonl"
: > "$OUT"

emit() {
  # emit <step> <assertion> <status> <expected> <actual> [detail]
  local step="$1" ass="$2" st="$3" exp="$4" act="$5" detail="${6:-}"
  jq -cn --arg s "$step" --arg a "$ass" --arg st "$st" \
        --arg e "$exp" --arg ac "$act" --arg d "$detail" \
        '{step:$s, assertion:$a, status:$st, expected:$e, actual:$ac, detail:$d}' >> "$OUT"
}

run_sql() {
  local file="$1" step="$2"
  local schema_counts allowed policies crons
  schema_counts="$(cat "$BASELINE/schema-counts.json" 2>/dev/null || echo '{}')"
  allowed="$(cat "$BASELINE/allowed-public-tables.json" 2>/dev/null || echo '[]')"
  policies="$(cat "$BASELINE/expected-policies.json" 2>/dev/null || echo '{}')"
  crons="$(cat "$BASELINE/expected-crons.json" 2>/dev/null || echo '[]')"

  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -A -t -F $'\t' \
    -v baseline_counts="$schema_counts" \
    -v allow_public="$allowed" \
    -v expected_policies="$policies" \
    -v expected_crons="$crons" \
    -f "$file" 2>&1 | while IFS=$'\t' read -r ass st exp act detail; do
      [ -z "$ass" ] && continue
      emit "$step" "$ass" "$st" "$exp" "$act" "$detail"
    done
}

run_sql "$DIR/01_schema.sql" schema
run_sql "$DIR/02_rls.sql"    rls
run_sql "$DIR/03_grants.sql" grants

STAGING_PROJECT_REF="$STAGING_PROJECT_REF" \
STAGING_ANON_KEY="$STAGING_ANON_KEY" \
TEST_ADMIN_JWT="${TEST_ADMIN_JWT:-}" \
  bash "$DIR/04_endpoints.sh" >> "$OUT"

run_sql "$DIR/05_crons.sql"  crons
run_sql "$DIR/06_secdef.sql" secdef

FAILS=$(grep -c '"status":"fail"' "$OUT" || true)
UNVER=$(grep -c '"status":"unverified"' "$OUT" || true)
TOTAL=$(wc -l < "$OUT" | tr -d ' ')

if [ "$JSON_ONLY" -eq 1 ]; then
  cat "$OUT"
else
  printf '%-10s %-45s %-10s %s\n' STEP ASSERTION STATUS DETAIL
  jq -r '[.step,.assertion,.status,.detail] | @tsv' "$OUT" \
    | awk -F'\t' '{printf "%-10s %-45s %-10s %s\n",$1,$2,$3,$4}'
  echo "—"
  echo "total=$TOTAL fails=$FAILS unverified=$UNVER"
fi

exit "$FAILS"
