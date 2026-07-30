#!/usr/bin/env bash
# copy-table.sh — copia UMA tabela de PROD para STAGING via COPY | COPY.
#
# Args: --run-id UUID --table NAME --group GNAME [--where SQL] [--columns "*"]
#       [--truncate true|false] [--snapshot true|false] [--snapshot-max-rows N]
#       [--dry-run]
#
# Env: PROD_DB_URL (readonly), STAGING_DB_URL
#
# Nunca escreve em PROD (só COPY (SELECT ...) TO STDOUT).
set -euo pipefail

RUN_ID=""; TABLE=""; GROUP=""; WHERE=""; COLUMNS="*"
TRUNCATE="true"; SNAPSHOT="true"; SNAPMAX=500000; DRY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --run-id) RUN_ID="$2"; shift 2 ;;
    --table) TABLE="$2"; shift 2 ;;
    --group) GROUP="$2"; shift 2 ;;
    --where) WHERE="$2"; shift 2 ;;
    --columns) COLUMNS="$2"; shift 2 ;;
    --truncate) TRUNCATE="$2"; shift 2 ;;
    --snapshot) SNAPSHOT="$2"; shift 2 ;;
    --snapshot-max-rows) SNAPMAX="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    *) echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
done

[ -n "$RUN_ID" ] && [ -n "$TABLE" ] && [ -n "$GROUP" ] || { echo "run-id/table/group obrigatórios" >&2; exit 2; }
[ -n "${PROD_DB_URL:-}" ] && [ -n "${STAGING_DB_URL:-}" ] || { echo "PROD_DB_URL/STAGING_DB_URL ausentes" >&2; exit 2; }

# Sanidade: nome de tabela seguro (evita injection em identifier)
if ! [[ "$TABLE" =~ ^[a-z_][a-z0-9_]*$ ]]; then
  echo "nome de tabela inválido: $TABLE" >&2; exit 2
fi

emit() {
  printf '{"ts":"%s","table":"%s","group":"%s","status":"%s","detail":%s}\n' \
    "$(date -u +%FT%TZ)" "$TABLE" "$GROUP" "$1" "$(jq -Rn --arg d "${2:-}" '$d')"
}

# WHERE seguro: dentro de subselect. Aspas simples permanecem no SQL.
SELECT_SQL="SELECT ${COLUMNS} FROM public.${TABLE}"
if [ -n "$WHERE" ]; then
  SELECT_SQL="${SELECT_SQL} WHERE ${WHERE}"
fi

# Contagem na origem
ROWS_SRC=$(psql "$PROD_DB_URL" -Atc "SELECT count(*) FROM (${SELECT_SQL}) s" 2>/dev/null || echo "-1")
emit "counted" "source=${ROWS_SRC}"

if [ "$DRY" -eq 1 ]; then
  emit "dry_run" "would_copy=${ROWS_SRC}"
  exit 0
fi

# Upsert checkpoint = running
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -Atc "
  INSERT INTO _migration.checkpoints (run_id,table_name,group_name,rows_source,started_at,status)
  VALUES ('${RUN_ID}','${TABLE}','${GROUP}',${ROWS_SRC},now(),'running')
  ON CONFLICT (run_id,table_name) DO UPDATE
    SET status='running', started_at=now(), rows_source=EXCLUDED.rows_source, error=NULL
" >/dev/null

# Snapshot para rollback (só se tabela existe em staging e cabe em SNAPMAX)
SNAP_TABLE=""
if [ "$SNAPSHOT" = "true" ]; then
  EXISTS=$(psql "$STAGING_DB_URL" -Atc "SELECT to_regclass('public.${TABLE}') IS NOT NULL")
  if [ "$EXISTS" = "t" ]; then
    STG_ROWS=$(psql "$STAGING_DB_URL" -Atc "SELECT count(*) FROM public.${TABLE}")
    if [ "$STG_ROWS" -gt "$SNAPMAX" ]; then
      emit "failed" "staging rows=${STG_ROWS} > snapshot_max_rows=${SNAPMAX}"
      psql "$STAGING_DB_URL" -Atc "
        UPDATE _migration.checkpoints
           SET status='failed', ended_at=now(), error='snapshot_max_rows exceeded'
         WHERE run_id='${RUN_ID}' AND table_name='${TABLE}'" >/dev/null
      exit 1
    fi
    SHORT="${RUN_ID//-/}"; SHORT="${SHORT:0:12}"
    SNAP_TABLE="_migration.snap_${TABLE}_${SHORT}"
    psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -c "
      CREATE TABLE IF NOT EXISTS ${SNAP_TABLE} AS TABLE public.${TABLE};
      REVOKE ALL ON ${SNAP_TABLE} FROM PUBLIC;
      GRANT ALL ON ${SNAP_TABLE} TO service_role;
    " >/dev/null
    emit "snapshot" "${SNAP_TABLE}"
    psql "$STAGING_DB_URL" -Atc "
      UPDATE _migration.checkpoints SET snapshot_table='${SNAP_TABLE}'
       WHERE run_id='${RUN_ID}' AND table_name='${TABLE}'" >/dev/null
  fi
fi

# TRUNCATE staging (opcional). CASCADE para respeitar FKs entre tabelas do run.
if [ "$TRUNCATE" = "true" ]; then
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -c "TRUNCATE public.${TABLE} CASCADE" >/dev/null
  emit "truncated"
fi

# Cópia streaming: nunca materializa em disco, nunca imprime linhas em log.
set +e
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -c "\\COPY (${SELECT_SQL}) TO STDOUT" \
  | psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -c "\\COPY public.${TABLE} FROM STDIN"
RC=${PIPESTATUS[0]}${PIPESTATUS[1]}
set -e

if [ "$RC" != "00" ]; then
  emit "failed" "copy pipestatus=${RC}"
  psql "$STAGING_DB_URL" -Atc "
    UPDATE _migration.checkpoints
       SET status='failed', ended_at=now(), error='copy failed rc=${RC}'
     WHERE run_id='${RUN_ID}' AND table_name='${TABLE}'" >/dev/null
  exit 1
fi

ROWS_DST=$(psql "$STAGING_DB_URL" -Atc "SELECT count(*) FROM public.${TABLE}")
psql "$STAGING_DB_URL" -Atc "
  UPDATE _migration.checkpoints
     SET status='done', ended_at=now(), rows_copied=${ROWS_DST}
   WHERE run_id='${RUN_ID}' AND table_name='${TABLE}'" >/dev/null

emit "done" "copied=${ROWS_DST}"
