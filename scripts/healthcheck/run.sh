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

JSON_ONLY=0
SKIP=()
while [ $# -gt 0 ]; do
  case "$1" in
    --json-only) JSON_ONLY=1 ;;
    --skip) shift; [ $# -gt 0 ] || { echo "flag --skip exige um check (webhooks|crons|realtime|events)" >&2; exit 2; }
            SKIP+=("$1") ;;
    --skip=*) SKIP+=("${1#--skip=}") ;;
    -h|--help)
      echo "Uso: $(basename "$0") [--json-only] [--skip <check>] [-h|--help]"
      echo ""
      echo "Opcoes:"
      echo "  --json-only        Emite apenas JSONL em stdout (sem cabeçalho humano)"
      echo "  --skip <check>     Pula um check específico (webhooks|crons|realtime|events)"
      echo "  -h, --help         Exibe esta ajuda"
      echo ""
      echo "Env obrigatório: STAGING_DB_URL, STAGING_PROJECT_REF, STAGING_ANON_KEY"
      exit 0 ;;
    *) echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
  shift
done
# Check com nome errado em --skip era ignorado em silêncio e o check rodava.
for s in "${SKIP[@]+"${SKIP[@]}"}"; do
  case "$s" in
    webhooks|crons|realtime|events) ;;
    *) echo "--skip desconhecido: $s (use webhooks|crons|realtime|events)" >&2; exit 2 ;;
  esac
done

# `if` em vez de `[ ... ] && printf`: sem --json-only a função devolvia 1.
emit() { printf '%s\n' "$1" | tee -a "$OUT" >&2 ; if [ "$JSON_ONLY" -eq 1 ]; then printf '%s\n' "$1"; fi ; }
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
export JSON_ONLY

skipped() { local s; for s in "${SKIP[@]+"${SKIP[@]}"}"; do [ "$s" = "$1" ] && return 0; done; return 1; }

# ---------- Preflight ----------
for bin in psql jq curl node; do
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

# mktemp: nome imprevisível e criação exclusiva. Com o nome fixo
# /tmp/healthcheck-<ts>.jsonl este arquivo podia ser o mesmo para onde o
# staging-migrate.sh redireciona o stdout deste script.
OUT="$(mktemp "${TMPDIR:-/tmp}/healthcheck-${TS}-XXXXXX.jsonl")"
export OUT
[ "$JSON_ONLY" -eq 0 ] && echo "▶ healthcheck run_id=$RUN_ID  log=$OUT"

# ---------- Executar checks ----------
skipped webhooks || bash "$HC_DIR/01_webhooks.sh" || true
run_crons() {
  local saida linha json n=0
  saida="$(psql "$STAGING_DB_URL" -v ON_ERROR_STOP=0 -q \
             -c "SET app.hc_run_id = '$RUN_ID'" \
             -f "$HC_DIR/02_crons.sql" 2>&1)" || true
  while IFS= read -r linha; do
    # Com -f o psql prefixa "psql:<arquivo>:<linha>: NOTICE:  " — o filtro
    # antigo (^NOTICE:) nunca casava e o check de crons não emitia nada.
    case "$linha" in *"NOTICE:  {"*) ;; *) continue ;; esac
    # jq -c normaliza o jsonb ("status": "fail", com espaço) para o formato
    # compacto que a contagem de fails procura.
    json="$(printf '%s' "{${linha#*NOTICE:  \{}" | jq -c . 2>/dev/null)" || continue
    emit "$json"
    n=$((n+1))
  done <<< "$saida"
  # Nenhuma linha = o SQL não rodou (conexão, permissão, erro de sintaxe).
  if [ "$n" -eq 0 ]; then
    log_line crons runner fail "02_crons.sql não produziu resultado: $(printf '%s' "$saida" | tr '\n' ' ' | cut -c1-200)"
  fi
}
skipped crons    || run_crons || true
skipped realtime || node "$HC_DIR/03_realtime.mjs" || true
skipped events   || bash "$HC_DIR/04_events.sh"    || true

# ---------- Resumo ----------
# grep -c já imprime 0 (e sai com 1) quando nada casa: com `|| echo 0` a
# variável virava "0\n0" e o `exit` final devolvia 2 justamente sem falhas.
FAILS=$(grep -c '"status":"fail"' "$OUT" 2>/dev/null || true)
UNV=$(grep -c '"status":"unverified"' "$OUT" 2>/dev/null || true)
PASS=$(grep -c '"status":"pass"' "$OUT" 2>/dev/null || true)
FAILS="${FAILS:-0}"

if [ "$JSON_ONLY" -eq 0 ]; then
  echo ""
  echo "═════ Healthcheck Summary ═════"
  echo " pass:        $PASS"
  echo " fail:        $FAILS"
  echo " unverified:  $UNV"
  echo " log:         $OUT"
fi

# Exit code é módulo 256: 256 falhas viraria 0 (sucesso).
[ "$FAILS" -gt 255 ] && FAILS=255
exit "$FAILS"
