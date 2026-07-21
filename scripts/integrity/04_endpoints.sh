#!/usr/bin/env bash
# 04_endpoints.sh — Smoke HTTP das Edge Functions críticas.
# Emite JSONL para stdout. Nunca imprime segredos.
set -euo pipefail

: "${STAGING_PROJECT_REF:?}"
: "${STAGING_ANON_KEY:?}"
TEST_ADMIN_JWT="${TEST_ADMIN_JWT:-}"

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

# health — GET anon → 200
check "health.anon_200" 200 "$(hit GET /health)"

# cnpja-lookup — POST anon → 200
check "cnpja_lookup.anon_200" 200 "$(hit POST /cnpja-lookup '' '' '{"cnpj":"00000000000191"}')"

# expert-agent — sem token → 401
check "expert_agent.no_token_401" 401 \
  "$(hit POST /expert-agent Authorization 'Bearer invalid' '{}')"

# expert-agent — com admin JWT → 200 (senão UNVERIFIED)
if [ -n "$TEST_ADMIN_JWT" ]; then
  code="$(hit POST /expert-agent Authorization "Bearer $TEST_ADMIN_JWT" '{"question":"ping"}')"
  check "expert_agent.admin_200" 200 "$code"
else
  emit "expert_agent.admin_200" unverified 200 "-" "TEST_ADMIN_JWT ausente"
fi

# asaas-webhook — sem HMAC → 401
check "asaas_webhook.no_hmac_401" 401 "$(hit POST /asaas-webhook '' '' '{}')"

# evaluate-delivery-alerts — anon → 200
check "evaluate_alerts.anon_200" 200 "$(hit POST /evaluate-delivery-alerts '' '' '{}')"

# get-mapbox-token — authenticated → 200 (senão UNVERIFIED)
if [ -n "$TEST_ADMIN_JWT" ]; then
  code="$(hit GET /get-mapbox-token Authorization "Bearer $TEST_ADMIN_JWT")"
  check "mapbox_token.auth_200" 200 "$code"
else
  emit "mapbox_token.auth_200" unverified 200 "-" "TEST_ADMIN_JWT ausente"
fi
