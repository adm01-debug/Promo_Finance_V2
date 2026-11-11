#!/usr/bin/env bash
# copy-table.sh — copia UMA tabela de PROD para STAGING via COPY | COPY.
#
# Args: --run-id UUID --table NAME --group GNAME [--where SQL] [--columns "*"]
#       [--truncate true|false] [--snapshot true|false] [--snapshot-max-rows N]
#       [--dry-run] [--snapshot-only]
#
# --snapshot-only  Só registra o checkpoint e tira o snapshot (não trunca nem
#                  copia). O orquestrador usa para fotografar TODAS as tabelas
#                  antes do primeiro TRUNCATE ... CASCADE.
#
# Env: PROD_DB_URL (readonly), STAGING_DB_URL, PROD_PROJECT_REF (opcional, trava)
#
# Nunca escreve em PROD (só COPY (SELECT ...) TO STDOUT).
set -euo pipefail

RUN_ID=""; TABLE=""; GROUP=""; WHERE=""; COLUMNS="*"
TRUNCATE="true"; SNAPSHOT="true"; SNAPMAX=500000; DRY=0; SNAP_ONLY=0

exige_valor() { [ $# -ge 2 ] || { echo "flag $1 exige um valor" >&2; exit 2; }; }

while [ $# -gt 0 ]; do
  case "$1" in
    --run-id) exige_valor "$@"; RUN_ID="$2"; shift 2 ;;
    --table) exige_valor "$@"; TABLE="$2"; shift 2 ;;
    --group) exige_valor "$@"; GROUP="$2"; shift 2 ;;
    --where) exige_valor "$@"; WHERE="$2"; shift 2 ;;
    --columns) exige_valor "$@"; COLUMNS="$2"; shift 2 ;;
    --truncate) exige_valor "$@"; TRUNCATE="$2"; shift 2 ;;
    --snapshot) exige_valor "$@"; SNAPSHOT="$2"; shift 2 ;;
    --snapshot-max-rows) exige_valor "$@"; SNAPMAX="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    --snapshot-only) SNAP_ONLY=1; shift ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
done

# shellcheck source=scripts/data/lib-alvo.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib-alvo.sh"

[ -n "$RUN_ID" ] && [ -n "$TABLE" ] && [ -n "$GROUP" ] || { echo "run-id/table/group obrigatórios" >&2; exit 2; }
[ -n "${PROD_DB_URL:-}" ] && [ -n "${STAGING_DB_URL:-}" ] || { echo "PROD_DB_URL/STAGING_DB_URL ausentes" >&2; exit 2; }

# Sanidade: nome de tabela seguro (evita injection em identifier)
if ! [[ "$TABLE" =~ ^[a-z_][a-z0-9_]*$ ]]; then
  echo "nome de tabela inválido: $TABLE" >&2; exit 2
fi
# run-id e grupo também entram em SQL e no JSONL: mesma régua.
[[ "$RUN_ID" =~ $RE_UUID ]] || { echo "run-id inválido (esperado UUID): $RUN_ID" >&2; exit 2; }
[[ "$GROUP" =~ $RE_GRUPO ]] || { echo "nome de grupo inválido: $GROUP" >&2; exit 2; }
[[ "$TRUNCATE" =~ ^(true|false)$ ]] || { echo "--truncate aceita true|false: $TRUNCATE" >&2; exit 2; }
[[ "$SNAPSHOT" =~ ^(true|false)$ ]] || { echo "--snapshot aceita true|false: $SNAPSHOT" >&2; exit 2; }
[[ "$SNAPMAX" =~ ^[0-9]+$ ]] || { echo "--snapshot-max-rows aceita inteiro >= 0: $SNAPMAX" >&2; exit 2; }

# O orquestrador já validou o alvo uma vez (DATA_MIGRATE_ALVO_OK=1); chamado
# avulso, este script valida por conta própria antes de qualquer escrita.
if [ "${DATA_MIGRATE_ALVO_OK:-0}" != "1" ]; then
  recusa_alvo_producao "$STAGING_DB_URL" "$PROD_DB_URL" "${PROD_PROJECT_REF:-}" || exit 2
fi

emit() {
  printf '{"ts":"%s","table":"%s","group":"%s","status":"%s","detail":%s}\n' \
    "$(date -u +%FT%TZ)" "$TABLE" "$GROUP" "$1" "$(jq -Rn --arg d "${2:-}" '$d')"
}

# Com "*", a lista de colunas vem do catálogo da ORIGEM e é usada dos dois
# lados: o COPY casa por nome (não por posição — a ordem das colunas pode
# divergir entre os ambientes) e colunas geradas ficam de fora (COPY FROM não
# as aceita). Coluna que falte no destino faz o COPY falhar, em vez de
# deslocar valores em silêncio.
DEST_COLS=""
if [ "$COLUMNS" = "*" ]; then
  LISTA=$(psql "$PROD_DB_URL" -q -Atc "
    SELECT string_agg(quote_ident(attname), ',' ORDER BY attnum)
      FROM pg_attribute
     WHERE attrelid = to_regclass('public.${TABLE}')
       AND attnum > 0 AND NOT attisdropped AND attgenerated = ''" 2>/dev/null || true)
  if [ -n "$LISTA" ]; then
    COLUMNS="$LISTA"
    DEST_COLS=" (${LISTA})"
  fi
fi

# WHERE seguro: dentro de subselect. Aspas simples permanecem no SQL.
SELECT_SQL="SELECT ${COLUMNS} FROM public.${TABLE}"
if [ -n "$WHERE" ]; then
  SELECT_SQL="${SELECT_SQL} WHERE ${WHERE}"
fi

# Contagem na origem
ERR_SRC=""
SAIDA_SRC=$(psql "$PROD_DB_URL" -v VERBOSITY=terse -Atc "SELECT count(*) FROM (${SELECT_SQL}) s" 2>&1) \
  && ROWS_SRC=$(printf '%s\n' "$SAIDA_SRC" | grep -E '^[0-9]+$' | tail -n 1) || ROWS_SRC=""
[ -n "$ROWS_SRC" ] || { ERR_SRC="$SAIDA_SRC"; ROWS_SRC="-1"; }
emit "counted" "source=${ROWS_SRC}"

# Origem ilegível (prod fora do ar, tabela ausente, WHERE inválido para esta
# tabela): para ANTES do TRUNCATE. Seguir adiante esvaziaria o staging para
# depois falhar no COPY.
if [ "$ROWS_SRC" = "-1" ]; then
  emit "failed" "origem ilegível, nada foi alterado em staging: $(printf '%s' "$ERR_SRC" | tr '\n' ' ' | cut -c1-200)"
  if [ "$DRY" -eq 0 ]; then
    psql "$STAGING_DB_URL" -q -Atc "
      INSERT INTO _migration.checkpoints (run_id,table_name,group_name,started_at,ended_at,status,error)
      VALUES ('${RUN_ID}','${TABLE}','${GROUP}',now(),now(),'failed','source unreadable')
      ON CONFLICT (run_id,table_name) DO UPDATE
        SET status='failed', ended_at=now(), error='source unreadable'" >/dev/null 2>&1 || true
  fi
  exit 1
fi

if [ "$DRY" -eq 1 ]; then
  emit "dry_run" "would_copy=${ROWS_SRC}"
  exit 0
fi

if [ "$SNAP_ONLY" -eq 1 ]; then
  # Fase de snapshot: não mexe no status de quem já tem checkpoint (resume).
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -q -Atc "
    INSERT INTO _migration.checkpoints (run_id,table_name,group_name,rows_source,status)
    VALUES ('${RUN_ID}','${TABLE}','${GROUP}',${ROWS_SRC},'pending')
    ON CONFLICT (run_id,table_name) DO NOTHING
  " >/dev/null
else
# Upsert checkpoint = running
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -q -Atc "
  INSERT INTO _migration.checkpoints (run_id,table_name,group_name,rows_source,started_at,status)
  VALUES ('${RUN_ID}','${TABLE}','${GROUP}',${ROWS_SRC},now(),'running')
  ON CONFLICT (run_id,table_name) DO UPDATE
    SET status='running', started_at=now(), rows_source=EXCLUDED.rows_source, error=NULL
" >/dev/null
fi

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
    SNAP_NAME="snap_${TABLE}_${SHORT}"
    # Identificador > 63 bytes é truncado em silêncio pelo Postgres; duas
    # tabelas de mesmo prefixo dividiriam um único snapshot.
    if [ "${#SNAP_NAME}" -gt 63 ]; then
      SNAP_NAME="snap_${TABLE:0:36}_$(printf '%s' "$TABLE" | md5sum | cut -c1-8)_${SHORT}"
    fi
    SNAP_TABLE="_migration.${SNAP_NAME}"
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

[ "$SNAP_ONLY" -eq 1 ] && exit 0

# TRUNCATE staging (opcional). CASCADE para respeitar FKs entre tabelas do run.
if [ "$TRUNCATE" = "true" ]; then
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -c "TRUNCATE public.${TABLE} CASCADE" >/dev/null
  emit "truncated"
fi

# Cópia streaming: nunca materializa em disco, nunca imprime linhas em log.
# O stderr dos dois psql é capturado e higienizado antes de ir para o log:
#  - VERBOSITY=terse tira CONTEXT/DETAIL, que trazem a linha inteira (dado de
#    produção) em qualquer erro de COPY;
#  - a mensagem principal de erro de tipo termina em `: "<valor>"` — o valor é
#    trocado por um marcador.
# O "COPY n" do destino vai para /dev/null porque o stdout deste script é JSONL.
set +e
SAIDA_COPY=$( { psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v VERBOSITY=terse -c "\\COPY (${SELECT_SQL}) TO STDOUT" \
                  | psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -v VERBOSITY=terse -c "\\COPY public.${TABLE}${DEST_COLS} FROM STDIN" >/dev/null
                printf '\nRC=%s%s' "${PIPESTATUS[0]}" "${PIPESTATUS[1]}"; } 2>&1 )
set -e
RC="${SAIDA_COPY##*RC=}"
ERR_COPY="$(printf '%s' "${SAIDA_COPY%RC=*}" | tr '\n' ' ' | sed -E 's/: ".*/: "<valor omitido>"/' | cut -c1-300)"
ERR_COPY="${ERR_COPY%"${ERR_COPY##*[![:space:]]}"}"

if [ "$RC" != "00" ]; then
  [ -z "$ERR_COPY" ] || echo "$ERR_COPY" >&2
  emit "failed" "copy pipestatus=${RC}${ERR_COPY:+ — $ERR_COPY}"
  psql "$STAGING_DB_URL" -Atc "
    UPDATE _migration.checkpoints
       SET status='failed', ended_at=now(), error='copy failed rc=${RC}'
     WHERE run_id='${RUN_ID}' AND table_name='${TABLE}'" >/dev/null
  exit 1
fi

# Sequences donas de colunas (serial/identity) acompanham o maior valor
# copiado; sem isso o próximo INSERT em staging colide com um id vindo de prod.
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -q -c "
  DO \$seq\$
  DECLARE r record; m bigint;
  BEGIN
    FOR r IN
      SELECT a.attname, pg_get_serial_sequence('public.${TABLE}', a.attname) AS seq
        FROM pg_attribute a
       WHERE a.attrelid = 'public.${TABLE}'::regclass AND a.attnum > 0 AND NOT a.attisdropped
    LOOP
      CONTINUE WHEN r.seq IS NULL;
      EXECUTE format('SELECT max(%I) FROM public.${TABLE}', r.attname) INTO m;
      IF m IS NOT NULL THEN PERFORM setval(r.seq, m); END IF;
    END LOOP;
  END \$seq\$;" >/dev/null 2>&1 || emit "warn" "sequence não ajustada (sem permissão?)"

ROWS_DST=$(psql "$STAGING_DB_URL" -Atc "SELECT count(*) FROM public.${TABLE}")
psql "$STAGING_DB_URL" -Atc "
  UPDATE _migration.checkpoints
     SET status='done', ended_at=now(), rows_copied=${ROWS_DST}
   WHERE run_id='${RUN_ID}' AND table_name='${TABLE}'" >/dev/null

emit "done" "copied=${ROWS_DST}"
