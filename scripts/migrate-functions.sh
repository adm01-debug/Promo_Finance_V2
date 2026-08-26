#!/usr/bin/env bash
# scripts/migrate-functions.sh
# Deploy em lote das Edge Functions para um projeto Supabase destino.
#
# Uso:
#   ./scripts/migrate-functions.sh [--dry-run] [--only fn1,fn2]
#
# Env obrigatórias:
#   SUPABASE_ACCESS_TOKEN=sbp_...
#   SUPABASE_PROJECT_REF=<ref do projeto destino>
#
# Env opcionais:
#   REQUIRED_SECRETS="LOVABLE_API_KEY,RESEND_API_KEY,..."   # aborta se faltar
#   FUNCTIONS_DIR=supabase/functions                        # default
#
# Saída: /tmp/deploy-log-YYYYMMDD-HHMM.jsonl

set -euo pipefail

DRY_RUN=0
ONLY=""
FUNCTIONS_DIR="${FUNCTIONS_DIR:-supabase/functions}"
CONFIG_TOML="supabase/config.toml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --only) ONLY="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Argumento desconhecido: $1" >&2; exit 2 ;;
  esac
done

# --- Validações -------------------------------------------------------------
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN é obrigatório (token sbp_...)}"
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF é obrigatório (ref do destino)}"

command -v supabase >/dev/null 2>&1 || { echo "supabase CLI não encontrado no PATH" >&2; exit 3; }
command -v jq >/dev/null 2>&1 || { echo "jq não encontrado no PATH" >&2; exit 3; }

[[ -d "$FUNCTIONS_DIR" ]] || { echo "Pasta $FUNCTIONS_DIR não existe" >&2; exit 4; }

TS="$(date -u +%Y%m%d-%H%M)"
LOG="/tmp/deploy-log-${TS}.jsonl"
: > "$LOG"

log_event() {
  # $1=event, $2=fn, $3=status, $4=extra_json (opcional)
  local extra="${4:-{\}}"
  jq -cn \
    --arg ts "$(date -u +%FT%TZ)" \
    --arg event "$1" \
    --arg fn "$2" \
    --arg status "$3" \
    --argjson extra "$extra" \
    '{ts:$ts, event:$event, fn:$fn, status:$status} + $extra' >> "$LOG"
}

echo "🔧 Destino: $SUPABASE_PROJECT_REF"
echo "📝 Log:     $LOG"
[[ $DRY_RUN -eq 1 ]] && echo "🧪 DRY-RUN ativo — nenhum deploy será executado."

# --- Verificação de secrets -------------------------------------------------
if [[ -n "${REQUIRED_SECRETS:-}" ]]; then
  echo "🔐 Verificando secrets obrigatórios no destino..."
  REMOTE_SECRETS="$(supabase secrets list --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null | awk 'NR>2 {print $1}' || true)"
  MISSING=()
  IFS=',' read -ra WANTED <<< "$REQUIRED_SECRETS"
  for s in "${WANTED[@]}"; do
    s="$(echo "$s" | xargs)"  # trim
    [[ -z "$s" ]] && continue
    if ! grep -qx "$s" <<< "$REMOTE_SECRETS"; then
      MISSING+=("$s")
    fi
  done
  if [[ ${#MISSING[@]} -gt 0 ]]; then
    log_event "secrets_check" "-" "failed" "$(jq -cn --argjson m "$(printf '%s\n' "${MISSING[@]}" | jq -R . | jq -s .)" '{missing:$m}')"
    echo "❌ Secrets faltando no destino: ${MISSING[*]}" >&2
    echo "   Configure via RUNBOOK §6 antes de rodar novamente." >&2
    exit 5
  fi
  log_event "secrets_check" "-" "ok" "$(jq -cn --argjson w "$(printf '%s\n' "${WANTED[@]}" | jq -R . | jq -s .)" '{checked:$w}')"
  echo "✅ Todos os secrets obrigatórios estão presentes."
fi

# --- Descoberta de functions ------------------------------------------------
declare -a FNS=()
if [[ -n "$ONLY" ]]; then
  IFS=',' read -ra FNS <<< "$ONLY"
else
  while IFS= read -r -d '' dir; do
    name="$(basename "$dir")"
    [[ "$name" == "_shared" ]] && continue
    [[ "$name" == .* ]] && continue
    [[ -f "$dir/index.ts" ]] || continue
    FNS+=("$name")
  done < <(find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d -print0)
fi

TOTAL=${#FNS[@]}
echo "📦 ${TOTAL} function(s) alvo."

# --- Helpers: validar cobertura do config.toml -----------------------------
config_functions() {
  awk '
    /^\[functions\.[^]]+\]$/ {
      line = $0
      sub(/^\[functions\./, "", line)
      sub(/\]$/, "", line)
      print line
    }
  ' "$CONFIG_TOML" | sort -u
}

verify_jwt_for() {
  local fn="$1"
  # Bloco: [functions.<fn>]   ... verify_jwt = true|false
  awk -v fn="$fn" '
    $0 ~ "^\\[functions\\."fn"\\]" { inblock=1; next }
    /^\[/ { inblock=0 }
    inblock && /^[[:space:]]*verify_jwt[[:space:]]*=/ {
      gsub(/[[:space:]]|verify_jwt|=/, "");
      print; exit
    }
  ' "$CONFIG_TOML" 2>/dev/null
}

validate_config_coverage() {
  local tmp_expected tmp_config missing unexpected
  tmp_expected="$(mktemp)"
  tmp_config="$(mktemp)"

  printf '%s\n' "${FNS[@]}" | sort -u > "$tmp_expected"
  config_functions > "$tmp_config"

  missing="$(comm -23 "$tmp_expected" "$tmp_config" || true)"
  unexpected="$(comm -13 "$tmp_expected" "$tmp_config" || true)"

  if [[ -n "$missing" ]]; then
    echo "❌ ${CONFIG_TOML} sem blocos [functions.<nome>] para:" >&2
    printf '%s\n' "$missing" >&2
    log_event "config_coverage" "-" "failed" \
      "$(jq -cn --argjson missing "$(printf '%s\n' "$missing" | jq -R . | jq -s .)" '{missing:$missing}')"
    rm -f "$tmp_expected" "$tmp_config"
    exit 6
  fi

  if [[ -n "$unexpected" ]]; then
    echo "⚠️ ${CONFIG_TOML} possui funções fora do lote alvo:" >&2
    printf '%s\n' "$unexpected" >&2
    log_event "config_coverage" "-" "warning" \
      "$(jq -cn --argjson extra "$(printf '%s\n' "$unexpected" | jq -R . | jq -s .)" '{extra:$extra}')"
  else
    log_event "config_coverage" "-" "ok" \
      "$(jq -cn --argjson total "$TOTAL" '{functions:$total}')"
  fi

  rm -f "$tmp_expected" "$tmp_config"
}

validate_config_coverage

# --- Loop de deploy ---------------------------------------------------------
OK=0; FAIL=0
for fn in "${FNS[@]}"; do
  vjwt="$(verify_jwt_for "$fn")"
  # Segurança fail-closed: toda função precisa declarar explicitamente a política
  # de JWT. Sem isso, um deploy em massa poderia tornar pública uma função que o
  # ambiente remoto atualmente protege na borda.
  if [[ -z "$vjwt" ]]; then
    echo "❌ ${fn}: verify_jwt ausente em ${CONFIG_TOML}; deploy recusado." >&2
    FAIL=$((FAIL + 1))
    log_event "deploy" "$fn" "failed" '{"reason":"verify_jwt_missing"}'
    continue
  elif [[ "$vjwt" == "true" ]]; then
    FLAG="--verify-jwt"
  elif [[ "$vjwt" == "false" ]]; then
    FLAG="--no-verify-jwt"
  else
    echo "❌ ${fn}: verify_jwt inválido em ${CONFIG_TOML}: ${vjwt}" >&2
    FAIL=$((FAIL + 1))
    log_event "deploy" "$fn" "failed" '{"reason":"verify_jwt_invalid"}'
    continue
  fi

  echo "→ deploy ${fn} (${FLAG})"
  if [[ $DRY_RUN -eq 1 ]]; then
    log_event "deploy" "$fn" "dry-run" "$(jq -cn --arg f "$FLAG" '{flag:$f}')"
    continue
  fi

  if supabase functions deploy "$fn" \
      --project-ref "$SUPABASE_PROJECT_REF" \
      "$FLAG" \
      >/tmp/deploy-out-$$.log 2>&1; then
    OK=$((OK+1))
    log_event "deploy" "$fn" "ok" "$(jq -cn --arg f "$FLAG" '{flag:$f}')"
  else
    FAIL=$((FAIL+1))
    ERR="$(tail -c 1000 /tmp/deploy-out-$$.log | jq -Rs .)"
    log_event "deploy" "$fn" "failed" "$(jq -cn --argjson e "$ERR" --arg f "$FLAG" '{flag:$f, error:$e}')"
    echo "   ❌ falhou — ver $LOG" >&2
  fi
  rm -f /tmp/deploy-out-$$.log
done

# --- Resumo -----------------------------------------------------------------
echo ""
echo "==================== RESUMO ===================="
echo "Total:   $TOTAL"
echo "OK:      $OK"
echo "Falhas:  $FAIL"
echo "Dry-run: $([[ $DRY_RUN -eq 1 ]] && echo sim || echo não)"
echo "Log:     $LOG"
echo "================================================"

log_event "summary" "-" "done" "$(jq -cn --argjson t $TOTAL --argjson o $OK --argjson f $FAIL '{total:$t, ok:$o, failed:$f}')"

[[ $FAIL -eq 0 ]]
