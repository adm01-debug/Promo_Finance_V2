#!/usr/bin/env bash
# data-migrate.sh — orquestrador de cópia de dados PROD → STAGING.
#
# Fluxo: preflight → plan → init-run → snapshot (todas) → copy (por tabela) → verify → finalize
#
# Env:
#   PROD_DB_URL (readonly), STAGING_DB_URL
#   STAGING_PROJECT_REF (opcional, guard-rail), PROD_PROJECT_REF (opcional)
#   MANIFEST=scripts/data/tables.yaml (default)
#   SNAPSHOT_MAX_ROWS (default: defaults.snapshot_max_rows do manifesto, senão 500000)
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
SNAPSHOT_MAX_ROWS="${SNAPSHOT_MAX_ROWS:-}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

DRY=0; YES=0; ONLY_GROUP=""; ONLY_TABLES=""; NO_SNAP=0; RESUME=""

exige_valor() { [ $# -ge 2 ] || { echo "flag $1 exige um valor" >&2; exit 2; }; }

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    --yes) YES=1; shift ;;
    --group) exige_valor "$@"; ONLY_GROUP="$2"; shift 2 ;;
    --tables) exige_valor "$@"; ONLY_TABLES="$2"; shift 2 ;;
    --no-snapshot) NO_SNAP=1; shift ;;
    --resume) exige_valor "$@"; RESUME="$2"; shift 2 ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    *) echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
done

# shellcheck source=scripts/data/lib-alvo.sh
source "$ROOT/scripts/data/lib-alvo.sh"
if [ -n "$RESUME" ] && ! [[ "$RESUME" =~ $RE_UUID ]]; then
  echo "--resume exige o UUID do run: $RESUME" >&2; exit 2
fi

# mktemp: nome imprevisível e criação exclusiva — /tmp/data-migrate-<ts>.jsonl
# fixo permitia symlink plantado e dois runs no mesmo segundo no mesmo arquivo.
LOG="$(mktemp "${TMPDIR:-/tmp}/data-migrate-${TS}-XXXXXX.jsonl")"
PLAN="$(mktemp "${TMPDIR:-/tmp}/data-plan-${TS}-XXXXXX.json")"

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
# O manifesto é lido com a sintaxe do jq (python-yq). O yq em Go (mikefarah),
# padrão nos runners do GitHub, interpreta os mesmos filtros de outro jeito.
if yq --version 2>&1 | grep -qi 'mikefarah'; then
  die "preflight" "yq incompatível (mikefarah/yq): este script usa o python-yq — 'pip install yq'"
fi
[ -n "${PROD_DB_URL:-}" ]     || die "preflight" "PROD_DB_URL ausente"
[ -n "${STAGING_DB_URL:-}" ]  || die "preflight" "STAGING_DB_URL ausente"
[ -f "$MANIFEST" ]            || die "preflight" "manifesto não encontrado: $MANIFEST"
yq -e '.groups | type == "array"' "$MANIFEST" >/dev/null 2>&1 \
  || die "preflight" "manifesto inválido (YAML ilegível ou sem lista .groups): $MANIFEST"

if [ -n "${PROD_PROJECT_REF:-}" ] && [ -n "${STAGING_PROJECT_REF:-}" ] \
   && [ "$PROD_PROJECT_REF" = "$STAGING_PROJECT_REF" ]; then
  die "preflight" "STAGING_PROJECT_REF == PROD_PROJECT_REF"
fi

# Sanidade extra: DB URLs devem ser diferentes
if [ "$PROD_DB_URL" = "$STAGING_DB_URL" ]; then
  die "preflight" "PROD_DB_URL == STAGING_DB_URL — abortando"
fi

# Trava de alvo: mesma base por URLs diferentes, ou staging apontando para o
# projeto de produção. Também prova que os dois bancos respondem — sem isso,
# prod fora do ar virava "tabela ausente em prod" e o run terminava em sucesso
# sem copiar nada.
MOTIVO="$(recusa_alvo_producao "$STAGING_DB_URL" "$PROD_DB_URL" "${PROD_PROJECT_REF:-}" 2>&1)" \
  || die "preflight" "$MOTIVO — abortando"
export DATA_MIGRATE_ALVO_OK=1

# Bootstrap schema _migration no staging (--dry-run não escreve em staging)
if [ "$DRY" -eq 0 ]; then
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/scripts/data/checkpoint.sql" >/dev/null \
    || die "preflight" "não foi possível criar schema _migration"
fi
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

# Nomes do manifesto entram em SQL (prod e staging) já no plano: validar aqui,
# antes da primeira consulta, e não só no worker.
for i in $(seq 0 $((NG-1))); do
  GNAME=$(yq -r ".groups[$i].name" "$MANIFEST")
  [[ "$GNAME" =~ $RE_GRUPO ]] || die "plan" "nome de grupo inválido no manifesto: $GNAME"
  while IFS= read -r T; do
    [[ "$T" =~ $RE_TABELA ]] || die "plan" "nome de tabela inválido no manifesto (grupo $GNAME): $T"
  done < <(yq -r ".groups[$i].tables[]?" "$MANIFEST")
done
if [ -n "$ONLY_GROUP" ]; then
  ALVO="$ONLY_GROUP" yq -e '[.groups[].name] | index(env.ALVO) != null' "$MANIFEST" >/dev/null 2>&1 \
    || die "plan" "--group não existe no manifesto: $ONLY_GROUP"
fi
for t in "${!ONLY_MAP[@]}"; do
  ALVO="$t" yq -e '[.groups[].tables[]?] | index(env.ALVO) != null' "$MANIFEST" >/dev/null 2>&1 \
    || die "plan" "--tables fora da allowlist do manifesto: $t"
done

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

TRUNC_DEF=$(yq -r '.defaults.truncate_before | if . == null then true else . end' "$MANIFEST")
# TRUNCATE ... CASCADE alcança toda tabela com FK (direta ou indireta) para as
# copiadas. As que não estão neste run ficam vazias e SEM snapshot: avisar no
# plano, antes da confirmação.
COLATERAIS=""
if [ "$TRUNC_DEF" = "true" ] && [ "$COPY_N" -gt 0 ]; then
  ALVOS=$(jq -r '[.[] | select(.status=="copy") | "public." + .table] | join(",")' "$PLAN")
  COLATERAIS=$(psql "$STAGING_DB_URL" -q -Atc "
    WITH RECURSIVE alvo AS (
      SELECT x::regclass::oid AS oid FROM unnest(string_to_array('${ALVOS}', ',')) x
    ), dep(oid) AS (
      SELECT c.conrelid FROM pg_constraint c JOIN alvo a ON c.confrelid = a.oid WHERE c.contype = 'f'
      UNION
      SELECT c.conrelid FROM pg_constraint c JOIN dep d ON c.confrelid = d.oid WHERE c.contype = 'f'
    )
    SELECT string_agg(oid::regclass::text, ', ' ORDER BY oid::regclass::text)
      FROM dep WHERE oid NOT IN (SELECT oid FROM alvo)" 2>/dev/null || true)
  [ -z "$COLATERAIS" ] || emit "plan" "warn" "TRUNCATE CASCADE também esvazia, sem snapshot: ${COLATERAIS}"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━ PLANO ━━━━━━━━━━━━━━━━━━━━"
jq -r '.[] | "  [\(.status | ascii_upcase)] \(.group)/\(.table)  rows=\(.rows_source)  \(if .reason != "" then "(\(.reason))" else "" end)"' "$PLAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: ${COPY_N} tabelas a copiar (~${TOTAL_ROWS} linhas), ${SKIP_N} ignoradas"
[ -z "$COLATERAIS" ] || echo "⚠ TRUNCATE CASCADE também esvazia (fora do run, sem snapshot): ${COLATERAIS}"
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
  RUN_OK=$(psql "$STAGING_DB_URL" -Atc "SELECT count(*) FROM _migration.runs WHERE id='${RUN_ID}'" 2>/dev/null || true)
  [ "$RUN_OK" = "1" ] || die "init-run" "run_id não encontrado: $RUN_ID"
  emit "init-run" "resume" "$RUN_ID"
else
  MHASH=$(sha256sum "$MANIFEST" | awk '{print $1}')
  # -q: sem ele o psql imprime também a tag "INSERT 0 1" e o RUN_ID capturado
  # deixava de ser um UUID — toda tabela falhava em seguida.
  RUN_ID=$(psql "$STAGING_DB_URL" -q -Atc "
    INSERT INTO _migration.runs (manifest_hash, dry_run, notes)
    VALUES ('${MHASH}', false, 'data-migrate ${TS}')
    RETURNING id") || die "init-run" "não foi possível registrar o run em _migration.runs"
  [[ "$RUN_ID" =~ $RE_UUID ]] || die "init-run" "run_id inesperado devolvido pelo staging"
  emit "init-run" "ok" "$RUN_ID"
fi
echo "RUN_ID=${RUN_ID}"

# --------------------- 4-5. copy loop --------------------
BATCH=$(yq -r '.defaults.batch_size // 5000' "$MANIFEST")
# `false // true` devolve true no jq/yq: com `//` o manifesto não conseguia
# desligar truncate_before nem snapshot.
SNAP_DEF=$(yq -r '.defaults.snapshot | if . == null then true else . end' "$MANIFEST")
COLS_DEF=$(yq -r '.defaults.columns // "*"' "$MANIFEST")
if [ -z "$SNAPSHOT_MAX_ROWS" ]; then
  SNAPSHOT_MAX_ROWS=$(yq -r '.defaults.snapshot_max_rows // 500000' "$MANIFEST")
fi
[[ "$SNAPSHOT_MAX_ROWS" =~ ^[0-9]+$ ]] || die "copy" "snapshot_max_rows inválido: $SNAPSHOT_MAX_ROWS"

FAILED_TABLES=()

# Fase 1 — snapshot de TODAS as tabelas antes do primeiro TRUNCATE. Tirar o
# snapshot tabela a tabela fotografava tabelas-filhas já esvaziadas pelo
# TRUNCATE ... CASCADE da tabela-pai, e o rollback "restaurava" o vazio.
# Se algum snapshot falhar, nada é truncado.
SNAP_GLOBAL="$SNAP_DEF"
[ "$NO_SNAP" -eq 1 ] && SNAP_GLOBAL="false"
if [ "$SNAP_GLOBAL" = "true" ]; then
  for i in $(seq 0 $((NG-1))); do
    GNAME=$(yq -r ".groups[$i].name" "$MANIFEST")
    GWHERE=$(yq -r ".groups[$i].where // \"\"" "$MANIFEST")
    [ -n "$ONLY_GROUP" ] && [ "$ONLY_GROUP" != "$GNAME" ] && continue
    while IFS= read -r T; do
      PLAN_STATUS=$(jq -r --arg t "$T" '.[] | select(.table==$t) | .status' "$PLAN" | head -1)
      [ "$PLAN_STATUS" = "copy" ] || continue
      if [ -n "$RESUME" ]; then
        ST=$(psql "$STAGING_DB_URL" -Atc "
          SELECT status FROM _migration.checkpoints
           WHERE run_id='${RUN_ID}' AND table_name='${T}'")
        [ "$ST" = "done" ] && continue
      fi
      set +e
      bash "$ROOT/scripts/data/copy-table.sh" --snapshot-only \
        --run-id "$RUN_ID" --table "$T" --group "$GNAME" --where "$GWHERE" \
        --columns "$COLS_DEF" --snapshot true \
        --snapshot-max-rows "$SNAPSHOT_MAX_ROWS" \
        | tee -a "$LOG"
      RC=${PIPESTATUS[0]}
      set -e
      if [ "$RC" -ne 0 ]; then
        FAILED_TABLES+=("$T")
        emit "snapshot" "fail" "$T rc=$RC"
      fi
    done < <(yq -r ".groups[$i].tables[]?" "$MANIFEST")
  done
fi

if [ "${#FAILED_TABLES[@]}" -gt 0 ]; then
  psql "$STAGING_DB_URL" -Atc "
    UPDATE _migration.runs SET status='failed', ended_at=now()
     WHERE id='${RUN_ID}'" >/dev/null
  emit "finalize" "fail" "snapshot falhou em: ${FAILED_TABLES[*]} — nenhuma tabela foi truncada"
  echo ""
  echo "❌ data-migrate abortado antes de truncar: snapshot falhou em ${FAILED_TABLES[*]}"
  echo "Log: $LOG"
  exit 1
fi

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
