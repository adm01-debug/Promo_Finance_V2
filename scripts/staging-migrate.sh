#!/usr/bin/env bash
# staging-migrate.sh — Orquestrador end-to-end de promoção para staging.
#
# Fases:
#   1. preflight           2. baseline-refresh   3. schema
#   4. secrets-check       5. functions          6. crons
#   7. integrity           8. summary (JSONL)
#
# Env obrigatório:
#   PROD_DB_URL, STAGING_DB_URL, STAGING_PROJECT_REF, STAGING_ANON_KEY,
#   SUPABASE_ACCESS_TOKEN, REQUIRED_SECRETS (CSV)
# Env opcional:
#   PROD_PROJECT_REF (guard-rail), TEST_ADMIN_JWT, ONLY_FUNCTIONS (CSV)
#
# Flags:
#   --dry-run           Todas as etapas em preview (sem escrever em staging)
#   --skip-baseline     Usa scripts/integrity/baseline/ já commitado
#   --only-integrity    Pula 3–6 e roda apenas integrity + summary
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="/tmp/staging-migrate-${TS}.jsonl"
DRY_RUN=0
SKIP_BASELINE=0
ONLY_INTEGRITY=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --skip-baseline) SKIP_BASELINE=1 ;;
    --only-integrity) ONLY_INTEGRITY=1 ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Flag desconhecida: $arg" >&2; exit 2 ;;
  esac
done

log_step() {
  local step="$1" status="$2" detail="${3:-}"
  printf '{"ts":"%s","step":"%s","status":"%s","detail":%s}\n' \
    "$(date -u +%FT%TZ)" "$step" "$status" \
    "$(jq -Rn --arg d "$detail" '$d')" | tee -a "$LOG"
}

die() { log_step "$1" "fail" "${2:-}"; echo "❌ $1 falhou: ${2:-}" >&2; exit 1; }

# ---------------------------- 1. preflight ---------------------------------
require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then die "preflight" "env $name ausente"; fi
}

log_step "preflight" "start"
for bin in psql jq curl envsubst supabase; do
  command -v "$bin" >/dev/null 2>&1 || die "preflight" "binário faltando: $bin"
done
for v in PROD_DB_URL STAGING_DB_URL STAGING_PROJECT_REF STAGING_ANON_KEY SUPABASE_ACCESS_TOKEN REQUIRED_SECRETS; do
  require_env "$v"
done

# Guard-rail: nunca escrever em produção
if [ -n "${PROD_PROJECT_REF:-}" ] && [ "$PROD_PROJECT_REF" = "$STAGING_PROJECT_REF" ]; then
  die "preflight" "STAGING_PROJECT_REF == PROD_PROJECT_REF — abortando"
fi
log_step "preflight" "ok"

# --------------------------- 2. baseline-refresh ---------------------------
if [ "$SKIP_BASELINE" -eq 0 ] && [ "$ONLY_INTEGRITY" -eq 0 ]; then
  log_step "baseline" "start"
  if [ "$DRY_RUN" -eq 1 ]; then
    log_step "baseline" "skipped" "dry-run"
  else
    bash "$ROOT/scripts/integrity/dump-baseline.sh" \
      || die "baseline" "dump-baseline falhou"
    log_step "baseline" "ok"
  fi
else
  log_step "baseline" "skipped" "flag"
fi

# ----------------------------- 3. schema -----------------------------------
run_schema() {
  log_step "schema" "start"
  if [ "$DRY_RUN" -eq 1 ]; then
    log_step "schema" "skipped" "dry-run"
    return
  fi
  # Aplicar migrations pendentes no staging
  ( cd "$ROOT" && SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
      supabase db push --db-url "$STAGING_DB_URL" ) \
      || die "schema" "supabase db push falhou"

  # Manutenção pós-schema
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 <<'SQL' \
      || die "schema" "post-schema falhou"
    SELECT public.maintain_monthly_partitions();
    ANALYZE;
SQL
  log_step "schema" "ok"
}

# ------------------------- 4. secrets-check --------------------------------
run_secrets_check() {
  log_step "secrets" "start"
  local missing=()
  IFS=',' read -r -a required <<< "$REQUIRED_SECRETS"
  # Lista secrets deployados no projeto
  local listed
  listed="$(supabase secrets list --project-ref "$STAGING_PROJECT_REF" 2>/dev/null \
              | awk 'NR>2 {print $1}' | grep -v '^$' || true)"
  for s in "${required[@]}"; do
    s="$(echo "$s" | xargs)"
    [ -z "$s" ] && continue
    if ! grep -Fxq "$s" <<< "$listed"; then
      missing+=("$s")
    fi
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    die "secrets" "faltando: ${missing[*]}"
  fi
  log_step "secrets" "ok"
}

# ---------------------------- 5. functions ---------------------------------
run_functions() {
  log_step "functions" "start"
  local args=()
  [ "$DRY_RUN" -eq 1 ] && args+=(--dry-run)
  [ -n "${ONLY_FUNCTIONS:-}" ] && args+=(--only "$ONLY_FUNCTIONS")
  SUPABASE_PROJECT_REF="$STAGING_PROJECT_REF" \
  SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
    bash "$ROOT/scripts/migrate-functions.sh" "${args[@]}" \
    || die "functions" "migrate-functions falhou"
  log_step "functions" "ok"
}

# ------------------------------ 6. crons -----------------------------------
run_crons() {
  log_step "crons" "start"
  local args=()
  [ "$DRY_RUN" -eq 1 ] && args+=(--dry-run)
  SUPABASE_PROJECT_REF="$STAGING_PROJECT_REF" \
  SUPABASE_ANON_KEY="$STAGING_ANON_KEY" \
  STAGING_DB_URL="$STAGING_DB_URL" \
    bash "$ROOT/scripts/migrate-cron-jobs.sh" "${args[@]}" \
    || die "crons" "migrate-cron-jobs falhou"
  log_step "crons" "ok"
}

# ---------------------------- 7. integrity ---------------------------------
run_integrity() {
  log_step "integrity" "start"
  STAGING_DB_URL="$STAGING_DB_URL" \
  STAGING_PROJECT_REF="$STAGING_PROJECT_REF" \
  STAGING_ANON_KEY="$STAGING_ANON_KEY" \
  TEST_ADMIN_JWT="${TEST_ADMIN_JWT:-}" \
    bash "$ROOT/scripts/integrity/run.sh" --json-only \
      > "/tmp/integrity-${TS}.jsonl" \
    || die "integrity" "assertions falharam — veja /tmp/integrity-${TS}.jsonl"
  log_step "integrity" "ok" "/tmp/integrity-${TS}.jsonl"
}

# --------------------------- orquestração ----------------------------------
if [ "$ONLY_INTEGRITY" -eq 0 ]; then
  run_schema
  run_secrets_check
  run_functions
  run_crons
fi
run_integrity

log_step "summary" "ok" "log=$LOG"
echo "✅ staging-migrate concluído — log: $LOG"
