#!/usr/bin/env bash
# 04_endpoints.sh — Smoke HTTP das Edge Functions críticas.
# Emite JSONL para stdout. Nunca imprime segredos.
set -euo pipefail

: "${STAGING_PROJECT_REF:?}"
: "${STAGING_ANON_KEY:?}"
TEST_ADMIN_JWT="${TEST_ADMIN_JWT:-}"
ANON_BEARER="Bearer ${STAGING_ANON_KEY}"

BASE="https://${STAGING_PROJECT_REF}.supabase.co/functions/v1"

emit() {
  local ass="$1" st="$2" exp="$3" act="$4" detail="${5:-}"
  jq -cn --arg s "endpoints" --arg a "$ass" --arg st "$st" \
        --arg e "$exp" --arg ac "$act" --arg d "$detail" \
        '{step:$s, assertion:$a, status:$st, expected:$e, actual:$ac, detail:$d}'
}

hit() {
  # hit <method> <path> <extra-header-name> <extra-header-value> [body]
  local method="$1" path="$2" hname="${3:-}" hval="${4:-}" body="${5:-}"
  local -a hdrs=(-H "apikey: $STAGING_ANON_KEY")
  [ -n "$hname" ] && hdrs+=(-H "$hname: $hval")
  if [ -n "$body" ]; then
    curl -sS --max-time 5 -o /dev/null -w '%{http_code}' \
      -X "$method" "${hdrs[@]}" -H 'Content-Type: application/json' \
      --data "$body" "$BASE$path" 2>/dev/null || echo "000"
  else
    curl -sS --max-time 5 -o /dev/null -w '%{http_code}' \
      -X "$method" "${hdrs[@]}" "$BASE$path" 2>/dev/null || echo "000"
  fi
}

check() {
  # check <assertion> <expected_code> <actual_code>
  local ass="$1" exp="$2" act="$3"
  if [ "$act" = "$exp" ]; then
    emit "$ass" pass "$exp" "$act" ""
  else
    emit "$ass" fail "$exp" "$act" "código inesperado"
  fi
}

check_one_of() {
  # check_one_of <assertion> <expected_csv> <actual_code>
  local ass="$1" expected_csv="$2" act="$3"
  IFS=',' read -r -a expected <<< "$expected_csv"
  local exp
  for exp in "${expected[@]}"; do
    if [ "$act" = "$exp" ]; then
      emit "$ass" pass "$expected_csv" "$act" ""
      return
    fi
  done
  emit "$ass" fail "$expected_csv" "$act" "código inesperado"
}

# health — endpoint público de status deve responder sem sessão
check "health.no_bearer_200" 200 "$(hit GET /health)"

# health — com bearer anon continua 200
check "health.anon_bearer_200" 200 \
  "$(hit GET /health Authorization "$ANON_BEARER")"

# cnpja-lookup — sem bearer → 401
check "cnpja_lookup.no_bearer_401" 401 \
  "$(hit POST /cnpja-lookup '' '' '{"cnpj":"00000000000191"}')"

# expert-agent — bearer inválido deve ser bloqueado antes do contrato
check "expert_agent.invalid_bearer_401" 401 \
  "$(hit POST /expert-agent Authorization 'Bearer invalid' '{}')"

# expert-agent — payload inválido com sessão válida usa envelope 422
if [ -n "$TEST_ADMIN_JWT" ]; then
  code="$(hit POST /expert-agent Authorization "Bearer $TEST_ADMIN_JWT" '{}')"
  check "expert_agent.invalid_payload_422" 422 "$code"
else
  emit "expert_agent.invalid_payload_422" unverified 422 "-" "TEST_ADMIN_JWT ausente"
fi

# expert-agent — com admin JWT → 200 (senão UNVERIFIED)
if [ -n "$TEST_ADMIN_JWT" ]; then
  code="$(hit POST /expert-agent Authorization "Bearer $TEST_ADMIN_JWT" '{"question":"ping"}')"
  check "expert_agent.admin_200" 200 "$code"
else
  emit "expert_agent.admin_200" unverified 200 "-" "TEST_ADMIN_JWT ausente"
fi

# asaas-webhook — sem token do provedor → 403
check "asaas_webhook.no_token_403" 403 "$(hit POST /asaas-webhook '' '' '{}')"

# bling-webhook — sem assinatura/token → 401
check "bling_webhook.no_auth_401" 401 "$(hit POST /bling-webhook '' '' '{}')"

# get-mapbox-token — com bearer anon deve atravessar auth da borda;
# 500 indica secret ausente, mas prova rota publicada e auth coerente.
check_one_of "mapbox_token.anon_bearer_runtime" "200,500" \
  "$(hit GET /get-mapbox-token Authorization "$ANON_BEARER")"
