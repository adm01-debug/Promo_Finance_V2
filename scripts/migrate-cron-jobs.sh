#!/usr/bin/env bash
# scripts/migrate-cron-jobs.sh
# Wrapper: faz envsubst em migrate-cron-jobs.sql e aplica via psql no destino.
#
# Uso:
#   ./scripts/migrate-cron-jobs.sh [--dry-run]
#
# Env obrigatórias:
#   DEST_DB_URL=postgresql://postgres:<senha>@<host>:5432/postgres
#   PROJECT_REF=<ref do destino>
#   ANON_KEY=<anon key do destino>

set -euo pipefail

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

: "${DEST_DB_URL:?DEST_DB_URL é obrigatório}"
: "${PROJECT_REF:?PROJECT_REF é obrigatório}"
: "${ANON_KEY:?ANON_KEY é obrigatório}"

command -v envsubst >/dev/null 2>&1 || { echo "envsubst não encontrado (pacote gettext)" >&2; exit 3; }
command -v psql     >/dev/null 2>&1 || { echo "psql não encontrado" >&2; exit 3; }

SRC="$(dirname "$0")/migrate-cron-jobs.sql"
[[ -f "$SRC" ]] || { echo "Arquivo $SRC não existe" >&2; exit 4; }

TS="$(date -u +%Y%m%d-%H%M)"
OUT="/tmp/cron-final-${TS}.sql"
LOG="/tmp/cron-apply-${TS}.log"

# envsubst só nas duas variáveis esperadas (protege $cron$ e outros $$)
export PROJECT_REF ANON_KEY
envsubst '${PROJECT_REF} ${ANON_KEY}' < "$SRC" > "$OUT"

echo "📄 SQL renderizado: $OUT"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "🧪 DRY-RUN — nenhuma alteração aplicada. Preview abaixo:"
  echo "------------------------------------------------------------"
  sed -n '1,60p' "$OUT"
  echo "... (truncado) ..."
  exit 0
fi

echo "🚀 Aplicando em $PROJECT_REF..."
psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f "$OUT" 2>&1 | tee "$LOG"

echo ""
echo "🔎 Validando cron.job..."
psql "$DEST_DB_URL" -c "SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;"

COUNT="$(psql "$DEST_DB_URL" -Atc "SELECT count(*) FROM cron.job;")"
echo ""
echo "✅ Total de jobs no destino: $COUNT (esperado ≥ 14)"
echo "📝 Log: $LOG"
