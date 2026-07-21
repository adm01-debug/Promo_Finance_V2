#!/usr/bin/env bash
# data-migrate.sh — orquestrador de cópia de dados PROD → STAGING.
#
# Fluxo: preflight → plan → init-run → snapshot+copy (por tabela) → verify → finalize
#
# Env:
#   PROD_DB_URL (readonly), STAGING_DB_URL
#   STAGING_PROJECT_REF (opcional, guard-rail), PROD_PROJECT_REF (opcional)
#   MANIFEST=scripts/data/tables.yaml (default)
#   SNAPSHOT_MAX_ROWS=500000
#
# Flags:
#   --dry-run          Só imprime o plano; não escreve em staging
#   --yes              Não pede confirmação interativa
#   --group NAME       Filtra apenas um grupo do manifesto
#   --tables csv       Filtra apenas tabelas listadas (subset da allowlist)
#   --no-snapshot      Desabilita snapshot (rollback deixa de funcionar)
#   --resume UUID      Retoma um run existente (só copia tabelas 'pending'/'failed')
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="${MANIFEST:-$ROOT/scripts/data/tables.yaml}"
SNAPSHOT_MAX_ROWS="${SNAPSHOT_MAX_ROWS:-500000}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="/tmp/data-migrate-${TS}.jsonl"
PLAN="/tmp/data-plan-${TS}.json"

DRY=0; YES=0; ONLY_GROUP=""; ONLY_TABLES=""; NO_SNAP=0; RESUME=""

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    --yes) YES=1; shift ;;
    --group) ONLY_GROUP="$2"; shift 2 ;;
    --tables) ONLY_TABLES="$2"; shift 2 ;;
    --no-snapshot) NO_SNAP=1; shift ;;
    --resume) RESUME="$2"; shift 2 ;;
    -h|--help) sed -n '2,25p' "$0"; exit 0 ;;
    *) echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
done

emit() {
  printf '{"ts":"%s","step":"%s","status":"%s","detail":%s}\n' \
    "$(date -u +%FT%TZ)" "$1" "$2" "$(jq -Rn --arg d "${3:-}" '$d')" | tee -a "$LOG"
}
die() { emit "$1" "fail" "${2:-}"; echo "❌ $1 falhou: ${2:-}" >&2; exit 1; }

# --------------------- 1. preflight ----------------------
emit "preflight" "start"
for bin in psql jq yq; do
  command -v "$bin" >/dev/null 2>&1 || die "preflight" "binário faltando: $bin (yq via 'pip install yq' ou 'brew install yq')"
done
[ -n "${PROD_DB_URL:-}" ]     || die "preflight" "PROD_DB_URL ausente"
[ -n "${STAGING_DB_URL:-}" ]  || die "preflight" "STAGING_DB_URL ausente"
[ -f "$MANIFEST" ]            || die "preflight" "manifesto não encontrado: $MANIFEST"

if [ -n "${PROD_PROJECT_REF:-}" ] && [ -n "${STAGING_PROJECT_REF:-}" ] \
   && [ "$PROD_PROJECT_REF" = "$STAGING_PROJECT_REF" ]; then
  die "preflight" "STAGING_PROJECT_REF == PROD_PROJECT_REF"
fi

# Sanidade extra: DB URLs devem ser diferentes
if [ "$PROD_DB_URL" = "$STAGING_DB_URL" ]; then
  die "preflight" "PROD_DB_URL == STAGING_DB_URL — abortando"
fi

# Bootstrap schema _migration no staging
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT/scripts/data/checkpoint.sql" >/dev/null \
  || die "preflight" "não foi possível criar schema _migration"
emit "preflight" "ok"

# --------------------- 2. plan ---------------------------
emit "plan" "start" "manifest=$MANIFEST"

# Padrões de blacklist (regex bash)
BL_PATTERNS='^(audit_logs.*|.*_logs?|.*_telemetry|frontend_error_logs.*|frontend_performance_logs|runtime_error_logs|rate_limit_logs|webhooks_log|login_attempts|sso_login_attempts|blocked_ips|cron_job_logs|query_telemetry.*)$'

# Blacklist explícita do manifesto
mapfile -t BL_EXTRA < <(yq -r '.blacklist_extra[]? // empty' "$MANIFEST")

is_blacklisted() {
  local t="$1"
  [[ "$t" =~ $BL_PATTERNS ]] && return 0
  for x in "${BL_EXTRA[@]}"; do [ "$t" = "$x" ] && return 0; done
  return 1
}

# Filtros CLI
declare -A ONLY_MAP
if [ -n "$ONLY_TABLES" ]; then
  IFS=',' read -r -a arr <<< "$ONLY_TABLES"
  for t in "${arr[@]}"; do ONLY_MAP["$(echo "$t"|xargs)"]=1; done
fi

# Coleta plano
NG=$(yq -r '.groups | length' "$MANIFEST")
PLAN_JSON="["
FIRST=1

for i in $(seq 0 $((NG-1))); do
  GNAME=$(yq -r ".groups[$i].name" "$MANIFEST")
  GWHERE=$(yq -r ".groups[$i].where // \"\"" "$MANIFEST")
  [ -n "$ONLY_GROUP" ] && [ "$ONLY_GROUP" != "$GNAME" ] && continue

  NT=$(yq -r ".groups[$i].tables | length" "$MANIFEST")
  for j in $(seq 0 $((NT-1))); do
    T=$(yq -r ".groups[$i].tables[$j]" "$MANIFEST")

    STATUS="copy"; REASON=""
    if [ -n "$ONLY_TABLES" ] && [ -z "${ONLY_MAP[$T]:-}" ]; then
      STATUS="skip"; REASON="filter --tables"
    elif is_blacklisted "$T"; then
      STATUS="skip"; REASON="blacklist"
    fi

    # Verifica existência em prod + staging
    EXISTS_PROD=$(psql "$PROD_DB_URL" -Atc "SELECT to_regclass('public.${T}') IS NOT NULL" 2>/dev/null || echo "f")
    EXISTS_STG=$(psql "$STAGING_DB_URL" -Atc "SELECT to_regclass('public.${T}') IS NOT NULL" 2>/dev/null || echo "f")
    if [ "$EXISTS_PROD" != "t" ]; then STATUS="skip"; REASON="ausente em prod"; fi
    if [ "$EXISTS_STG" != "t" ]; then STATUS="skip"; REASON="ausente em staging"; fi

    CNT="-1"
    if [ "$STATUS" = "copy" ]; then
      SQL="SELECT count(*) FROM public.${T}"
      [ -n "$GWHERE" ] && SQL="${SQL} WHERE ${GWHERE}"
      CNT=$(psql "$PROD_DB_URL" -Atc "$SQL" 2>/dev/null || echo "-1")
    fi

    [ $FIRST -eq 0 ] && PLAN_JSON+=","
    FIRST=0
    PLAN_JSON+=$(jq -nc \
      --arg g "$GNAME" --arg t "$T" --arg s "$STATUS" \
      --arg r "$REASON" --arg w "$GWHERE" --argjson c "$CNT" \
      '{group:$g,table:$t,status:$s,reason:$r,where:$w,rows_source:$c}')
  done
done
PLAN_JSON+="]"

echo "$PLAN_JSON" | jq . > "$PLAN"
COPY_N=$(jq '[.[] | select(.status=="copy")] | length' "$PLAN")
SKIP_N=$(jq '[.[] | select(.status=="skip")] | length' "$PLAN")
TOTAL_ROWS=$(jq '[.[] | select(.status=="copy") | .rows_source] | add // 0' "$PLAN")

emit "plan" "ok" "copy=${COPY_N} skip=${SKIP_N} rows≈${TOTAL_ROWS} file=${PLAN}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━ PLANO ━━━━━━━━━━━━━━━━━━━━"
jq -r '.[] | "  [\(.status | ascii_upcase)] \(.group)/\(.table)  rows=\(.rows_source)  \(if .reason != "" then "(\(.reason))" else "" end)"' "$PLAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: ${COPY_N} tabelas a copiar (~${TOTAL_ROWS} linhas), ${SKIP_N} ignoradas"
echo ""

if [ "$DRY" -eq 1 ]; then
  emit "dry_run" "ok" "encerrando após plano"
  exit 0
fi

if [ "$YES" -ne 1 ] && [ -z "$RESUME" ]; then
  read -r -p "Confirmar cópia PROD → STAGING? [yes/N] " ANS
  [ "$ANS" = "yes" ] || die "plan" "cancelado pelo operador"
fi

# --------------------- 3. init-run -----------------------
if [ -n "$RESUME" ]; then
  RUN_ID="$RESUME"
  RUN_OK=$(psql "$STAGING_DB_URL" -Atc "SELECT count(*) FROM _migration.runs WHERE id='${RUN_ID}'")
  [ "$RUN_OK" = "1" ] || die "init-run" "run_id não encontrado: $RUN_ID"
  emit "init-run" "resume" "$RUN_ID"
else
  MHASH=$(sha256sum "$MANIFEST" | awk '{print $1}')
  RUN_ID=$(psql "$STAGING_DB_URL" -Atc "
    INSERT INTO _migration.runs (manifest_hash, dry_run, notes)
    VALUES ('${MHASH}', false, 'data-migrate ${TS}')
    RETURNING id")
  emit "init-run" "ok" "$RUN_ID"
fi
echo "RUN_ID=${RUN_ID}"

# --------------------- 4-5. copy loop --------------------
BATCH=$(yq -r '.defaults.batch_size // 5000' "$MANIFEST")
TRUNC_DEF=$(yq -r '.defaults.truncate_before // true' "$MANIFEST")
SNAP_DEF=$(yq -r '.defaults.snapshot // true' "$MANIFEST")
COLS_DEF=$(yq -r '.defaults.columns // "*"' "$MANIFEST")

FAILED_TABLES=()

for i in $(seq 0 $((NG-1))); do
  GNAME=$(yq -r ".groups[$i].name" "$MANIFEST")
  GWHERE=$(yq -r ".groups[$i].where // \"\"" "$MANIFEST")
  [ -n "$ONLY_GROUP" ] && [ "$ONLY_GROUP" != "$GNAME" ] && continue

  NT=$(yq -r ".groups[$i].tables | length" "$MANIFEST")
  for j in $(seq 0 $((NT-1))); do
    T=$(yq -r ".groups[$i].tables[$j]" "$MANIFEST")

    # Aplica os mesmos filtros que o plano
    PLAN_STATUS=$(jq -r --arg t "$T" '.[] | select(.table==$t) | .status' "$PLAN" | head -1)
    [ "$PLAN_STATUS" = "copy" ] || continue

    # Resume: só toca tabelas ainda não concluídas
    if [ -n "$RESUME" ]; then
      ST=$(psql "$STAGING_DB_URL" -Atc "
        SELECT status FROM _migration.checkpoints
         WHERE run_id='${RUN_ID}' AND table_name='${T}'")
      [ "$ST" = "done" ] && { emit "copy" "skip" "$T (already done)"; continue; }
    fi

    SNAP_FLAG="$SNAP_DEF"
    [ "$NO_SNAP" -eq 1 ] && SNAP_FLAG="false"

    set +e
    bash "$ROOT/scripts/data/copy-table.sh" \
      --run-id "$RUN_ID" \
      --table "$T" \
      --group "$GNAME" \
      --where "$GWHERE" \
      --columns "$COLS_DEF" \
      --truncate "$TRUNC_DEF" \
      --snapshot "$SNAP_FLAG" \
      --snapshot-max-rows "$SNAPSHOT_MAX_ROWS" \
      | tee -a "$LOG"
    RC=${PIPESTATUS[0]}
    set -e

    if [ "$RC" -ne 0 ]; then
      FAILED_TABLES+=("$T")
      emit "copy" "fail" "$T rc=$RC"
    fi
  done
done

# --------------------- 6. verify -------------------------
emit "verify" "start"
set +e
bash "$ROOT/scripts/data/verify.sh" --run-id "$RUN_ID" | tee -a "$LOG"
VRC=${PIPESTATUS[0]}
set -e
if [ "$VRC" -ne 0 ]; then
  emit "verify" "fail" "$VRC assertions falharam"
else
  emit "verify" "ok"
fi

# --------------------- 7. finalize -----------------------
if [ "${#FAILED_TABLES[@]}" -gt 0 ] || [ "$VRC" -ne 0 ]; then
  psql "$STAGING_DB_URL" -Atc "
    UPDATE _migration.runs SET status='failed', ended_at=now()
     WHERE id='${RUN_ID}'" >/dev/null
  emit "finalize" "fail" "tabelas com falha: ${FAILED_TABLES[*]:-nenhuma} | verify_rc=${VRC}"
  echo ""
  echo "❌ data-migrate falhou. Para reverter:"
  echo "   ./scripts/data/rollback.sh --run-id ${RUN_ID}"
  echo "Log: $LOG"
  exit 1
fi

psql "$STAGING_DB_URL" -Atc "
  UPDATE _migration.runs SET status='done', ended_at=now()
   WHERE id='${RUN_ID}'" >/dev/null
emit "finalize" "ok" "run=${RUN_ID}"
echo ""
echo "✅ data-migrate concluído — run_id=${RUN_ID}"
echo "   Plano: $PLAN"
echo "   Log:   $LOG"
