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

# Executa TODOS os passos em ordem lexicográfica (01…NN). Antes desta versão a
# lista era hard-coded em 01→05, então os gates #26–#34 (06_secdef …
# 13_unused_indexes) existiam no repositório mas nunca eram executados.
for arquivo in "$DIR"/[0-9][0-9]_*.{sql,sh}; do
  [ -e "$arquivo" ] || continue
  nome="$(basename "$arquivo")"
  step="${nome%.*}"; step="${step#[0-9][0-9]_}"

  case "$arquivo" in
    *.sql)
      run_sql "$arquivo" "$step"
      ;;
    *.sh)
      STAGING_PROJECT_REF="$STAGING_PROJECT_REF" \
      STAGING_ANON_KEY="$STAGING_ANON_KEY" \
      TEST_ADMIN_JWT="${TEST_ADMIN_JWT:-}" \
        bash "$arquivo" >> "$OUT"
      ;;
  esac
done


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
