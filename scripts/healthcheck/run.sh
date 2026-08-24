#!/usr/bin/env bash
# scripts/healthcheck/run.sh
# Healthcheck pós-corte — valida comportamento real (não estrutura).
#
# Escopo: 4 checks — webhooks, crons, realtime, event bus.
# Cada assertion emite 1 linha JSONL em $OUT (stdout se --json-only).
# Exit code = número de linhas com status="fail".
# "unverified" NÃO falha, mas fica visível no relatório.
#
# Env obrigatório:
#   STAGING_DB_URL, STAGING_PROJECT_REF, STAGING_ANON_KEY
# Env opcional:
#   TEST_ADMIN_JWT, PROD_PROJECT_REF (guard-rail),
#   ASAAS_WEBHOOK_TOKEN, etc.
#
# Flags:
#   --json-only   Emite apenas JSONL em stdout (sem cabeçalho humano)
#   --skip <check>  Pula um check específico (webhooks|crons|realtime|events)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HC_DIR="$ROOT/scripts/healthcheck"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_ID="$(uuidgen 2>/dev/null || python3 -c 'import uuid;print(uuid.uuid4())')"
export RUN_ID
OUT="/tmp/healthcheck-${TS}.jsonl"

JSON_ONLY=0
SKIP=()
for arg in "$@"; do
  case "$arg" in
    --json-only) JSON_ONLY=1 ;;
    --skip) shift; SKIP+=("$1") ;;
    --skip=*) SKIP+=("${arg#--skip=}") ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
  esac
done

emit() { printf '%s\n' "$1" | tee -a "$OUT" >&2 ; [ "$JSON_ONLY" -eq 1 ] && printf '%s\n' "$1" ; }
log_line() {
  local check="$1" target="$2" status="$3" detail="${4:-}" extra="${5:-}"
  local base
  base=$(jq -cn --arg ts "$(date -u +%FT%TZ)" --arg c "$check" --arg t "$target" \
                --arg s "$status" --arg d "$detail" --arg r "$RUN_ID" \
       '{ts:$ts,check:$c,target:$t,status:$s,detail:$d,run_id:$r}')
  if [ -n "$extra" ]; then base=$(echo "$base $extra" | jq -sc 'add'); fi
  emit "$base"
}
export -f log_line emit
export OUT JSON_ONLY

skipped() { for s in "${SKIP[@]:-}"; do [ "$s" = "$1" ] && return 0; done; return 1; }

# ---------- Preflight ----------
for bin in psql jq curl; do
  command -v "$bin" >/dev/null 2>&1 || { echo "❌ falta binário: $bin" >&2; exit 2; }
done
: "${STAGING_DB_URL:?STAGING_DB_URL ausente}"
: "${STAGING_PROJECT_REF:?STAGING_PROJECT_REF ausente}"
: "${STAGING_ANON_KEY:?STAGING_ANON_KEY ausente}"

if [ -n "${PROD_PROJECT_REF:-}" ] && [ "$PROD_PROJECT_REF" = "$STAGING_PROJECT_REF" ]; then
  echo "❌ STAGING_PROJECT_REF == PROD_PROJECT_REF — abortando healthcheck" >&2
  exit 2
fi

FUNCTIONS_BASE="https://${STAGING_PROJECT_REF}.functions.supabase.co"
export FUNCTIONS_BASE STAGING_DB_URL STAGING_ANON_KEY

cleanup() {
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=0 -q >/dev/null 2>&1 <<SQL || true
    DELETE FROM public.webhook_events
      WHERE raw_payload ->> 'healthcheck_run_id' = '${RUN_ID}';
    DELETE FROM public.webhooks_log
      WHERE payload ->> 'healthcheck_run_id' = '${RUN_ID}';
    DELETE FROM public.alerts
      WHERE metadata ->> 'healthcheck_run_id' = '${RUN_ID}';
    DELETE FROM public.n8n_dispatch_logs
      WHERE payload ->> 'healthcheck_run_id' = '${RUN_ID}';
SQL
}
trap cleanup EXIT

: > "$OUT"
[ "$JSON_ONLY" -eq 0 ] && echo "▶ healthcheck run_id=$RUN_ID  log=$OUT"

# ---------- Executar checks ----------
skipped webhooks || bash "$HC_DIR/01_webhooks.sh" || true
skipped crons    || psql "$STAGING_DB_URL" -v ON_ERROR_STOP=0 -q -f "$HC_DIR/02_crons.sql" 2>/dev/null | grep '^{' | while read -r l; do emit "$l"; done || true
skipped realtime || node "$HC_DIR/03_realtime.mjs" || true
skipped events   || bash "$HC_DIR/04_events.sh"    || true

# ---------- Resumo ----------
FAILS=$(grep -c '"status":"fail"' "$OUT" 2>/dev/null || echo 0)
UNV=$(grep -c '"status":"unverified"' "$OUT" 2>/dev/null || echo 0)
PASS=$(grep -c '"status":"pass"' "$OUT" 2>/dev/null || echo 0)

if [ "$JSON_ONLY" -eq 0 ]; then
  echo ""
  echo "═════ Healthcheck Summary ═════"
  echo " pass:        $PASS"
  echo " fail:        $FAILS"
  echo " unverified:  $UNV"
  echo " log:         $OUT"
fi

exit "$FAILS"
