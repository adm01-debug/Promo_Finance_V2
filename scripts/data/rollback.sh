#!/usr/bin/env bash
# rollback.sh — restaura snapshots de um run em staging.
# Uso: ./scripts/data/rollback.sh --run-id <uuid> [--dry-run]
#
# Nunca executa automaticamente. Requer STAGING_DB_URL.
set -euo pipefail

RUN_ID=""; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --run-id) RUN_ID="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
done

[ -n "$RUN_ID" ] || { echo "--run-id obrigatório" >&2; exit 2; }
[ -n "${STAGING_DB_URL:-}" ] || { echo "STAGING_DB_URL ausente" >&2; exit 2; }

emit() {
  printf '{"ts":"%s","run_id":"%s","table":"%s","status":"%s","detail":%s}\n' \
    "$(date -u +%FT%TZ)" "$RUN_ID" "${1:-}" "${2:-}" "$(jq -Rn --arg d "${3:-}" '$d')"
}

RUN_EXISTS=$(psql "$STAGING_DB_URL" -Atc \
  "SELECT count(*) FROM _migration.runs WHERE id='${RUN_ID}'")
[ "$RUN_EXISTS" = "1" ] || { echo "run_id não encontrado" >&2; exit 1; }

# Snapshot de tabelas afetadas
mapfile -t ROWS < <(psql "$STAGING_DB_URL" -Atc "
  SELECT table_name || '|' || COALESCE(snapshot_table,'') || '|' || status
    FROM _migration.checkpoints
   WHERE run_id='${RUN_ID}' AND status IN ('done','failed')
   ORDER BY table_name")

if [ "${#ROWS[@]}" -eq 0 ]; then
  echo "Nada a reverter para o run ${RUN_ID}"
  exit 0
fi

echo "→ Rollback do run ${RUN_ID} (${#ROWS[@]} tabelas)"
for line in "${ROWS[@]}"; do
  IFS='|' read -r T SNAP ST <<< "$line"
  if [ -z "$SNAP" ]; then
    emit "$T" "skipped" "sem snapshot"
    continue
  fi
  if [ "$DRY" -eq 1 ]; then
    emit "$T" "dry_run" "restauraria de ${SNAP}"
    continue
  fi
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 <<SQL >/dev/null
BEGIN;
TRUNCATE public.${T} CASCADE;
INSERT INTO public.${T} SELECT * FROM ${SNAP};
UPDATE _migration.checkpoints
   SET status='rolled_back', ended_at=now()
 WHERE run_id='${RUN_ID}' AND table_name='${T}';
COMMIT;
SQL
  emit "$T" "restored" "$SNAP"
done

if [ "$DRY" -eq 0 ]; then
  psql "$STAGING_DB_URL" -Atc "
    UPDATE _migration.runs
       SET status='rolled_back', ended_at=now(),
           notes = COALESCE(notes,'') || E'\nrolled_back at ' || now()
     WHERE id='${RUN_ID}'" >/dev/null
fi
echo "✅ rollback concluído"
