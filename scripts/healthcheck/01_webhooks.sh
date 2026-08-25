#!/usr/bin/env bash
# 01_webhooks.sh — dispara webhooks reais no staging e valida recepção.
# Executado por run.sh; usa emit/log_line exportados.
set -uo pipefail

HC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES="$HC_DIR/fixtures"
BASELINE="$HC_DIR/baseline/expected-webhooks.json"

: "${RUN_ID:?RUN_ID ausente}"
: "${FUNCTIONS_BASE:?FUNCTIONS_BASE ausente}"
: "${STAGING_DB_URL:?STAGING_DB_URL ausente}"
: "${STAGING_ANON_KEY:?STAGING_ANON_KEY ausente}"

# helper local (log_line pode não estar exportado dependendo do shell)
_emit() {
  local check="$1" target="$2" status="$3" detail="${4:-}" latency="${5:-null}"
  jq -cn --arg ts "$(date -u +%FT%TZ)" --arg c "$check" --arg t "$target" \
         --arg s "$status" --arg d "$detail" --arg r "$RUN_ID" \
         --argjson lat "$latency" \
    '{ts:$ts,check:$c,target:$t,status:$s,detail:$d,run_id:$r,latency_ms:$lat}' \
    | tee -a "$OUT"
}

count=$(jq 'length' "$BASELINE")
for i in $(seq 0 $((count-1))); do
  name=$(jq -r ".[$i].name" "$BASELINE")
  auth=$(jq -r ".[$i].auth" "$BASELINE")
  token_env=$(jq -r ".[$i].token_env // empty" "$BASELINE")
  token_header=$(jq -r ".[$i].token_header // empty" "$BASELINE")
  fixture=$(jq -r ".[$i].fixture" "$BASELINE")
  expect_status=$(jq -r ".[$i].expect_status" "$BASELINE")
  invalid_status=$(jq -r ".[$i].invalid_status" "$BASELINE")
  max_latency=$(jq -r ".[$i].max_latency_ms" "$BASELINE")
  provider=$(jq -r ".[$i].expect_webhooks_log_provider // empty" "$BASELINE")

  fixture_path="$FIXTURES/$fixture"
  if [ ! -f "$fixture_path" ]; then
    _emit webhooks "$name" unverified "fixture ausente: $fixture"
    continue
  fi

  # Schemas de webhook são estritos; metadados do healthcheck não podem ser
  # injetados no contrato do provedor sem transformar um payload válido em 422.
  payload=$(jq -c '.' "$fixture_path")
  url="$FUNCTIONS_BASE/$name"

  # cabeçalhos de auth
  hdr_valid=(-H "Content-Type: application/json" -H "apikey: $STAGING_ANON_KEY")
  hdr_invalid=(-H "Content-Type: application/json" -H "apikey: $STAGING_ANON_KEY")
  can_valid=1
  case "$auth" in
    token)
      token_val="${!token_env:-}"
      if [ -z "$token_val" ]; then
        _emit webhooks "$name" unverified "secret $token_env ausente"
        can_valid=0
      else
        hdr_valid+=(-H "$token_header: $token_val")
        hdr_invalid+=(-H "$token_header: invalid-$RUN_ID")
      fi
      ;;
    none) ;;
    *) _emit webhooks "$name" unverified "auth mode desconhecido: $auth"; continue ;;
  esac

  # 1) Chamada VÁLIDA
  if [ "$can_valid" -eq 1 ]; then
    t0=$(date +%s%3N 2>/dev/null || python3 -c 'import time;print(int(time.time()*1000))')
    code=$(curl -sS -o /tmp/hc_body_$$ -w '%{http_code}' -X POST "$url" \
             "${hdr_valid[@]}" --data "$payload" --max-time 15 || echo 000)
    t1=$(date +%s%3N 2>/dev/null || python3 -c 'import time;print(int(time.time()*1000))')
    dt=$((t1 - t0))
    if [ "$code" = "$expect_status" ] || { [ "$code" -ge 200 ] 2>/dev/null && [ "$code" -lt 300 ] 2>/dev/null; }; then
      if [ "$dt" -le "$max_latency" ]; then
        _emit webhooks "${name}.valid" pass "http=$code" "$dt"
      else
        _emit webhooks "${name}.valid" fail "http=$code latency ${dt}ms > ${max_latency}ms" "$dt"
      fi
    else
      body=$(head -c 200 /tmp/hc_body_$$ 2>/dev/null || true)
      _emit webhooks "${name}.valid" fail "http=$code body=$(echo "$body" | tr -d '\n')" "$dt"
    fi
    rm -f /tmp/hc_body_$$
  fi

  # 2) Chamada INVÁLIDA (só faz sentido se há auth verificável)
  if [ "$auth" = "token" ] && [ "$can_valid" -eq 1 ]; then
    code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$url" \
             "${hdr_invalid[@]}" --data "$payload" --max-time 15 || echo 000)
    if [ "$code" = "$invalid_status" ] || [ "$code" = "401" ] || [ "$code" = "403" ]; then
      _emit webhooks "${name}.invalid" pass "http=$code rejected"
    else
      _emit webhooks "${name}.invalid" fail "expected reject, http=$code"
    fi
  fi

  # 3) Propagação para webhooks_log (poll até 10s)
  if [ -n "$provider" ] && [ "$can_valid" -eq 1 ]; then
    found=0
    for _ in 1 2 3 4 5; do
      n=$(psql "$STAGING_DB_URL" -Atc \
        "SELECT count(*) FROM public.webhooks_log
          WHERE provider = '$provider'
            AND (payload ->> 'healthcheck_run_id') = '$RUN_ID';" 2>/dev/null || echo 0)
      if [ "${n:-0}" -ge 1 ]; then found=1; break; fi
      sleep 2
    done
    if [ "$found" -eq 1 ]; then
      _emit webhooks "${name}.persisted" pass "webhooks_log rows>=1"
    else
      _emit webhooks "${name}.persisted" fail "não encontrou linha em webhooks_log (10s)"
    fi
  fi

  # 4) DLQ deve permanecer vazia para esse run_id
  ndlq=$(psql "$STAGING_DB_URL" -Atc \
    "SELECT count(*) FROM public.webhook_dlq
      WHERE (payload ->> 'healthcheck_run_id') = '$RUN_ID'
        AND source ILIKE '%$provider%';" 2>/dev/null || echo 0)
  if [ "${ndlq:-0}" -eq 0 ]; then
    _emit webhooks "${name}.dlq_clean" pass "dlq=0"
  else
    _emit webhooks "${name}.dlq_clean" fail "dlq=$ndlq entries para run_id"
  fi
done
