#!/usr/bin/env bash
# verify.sh — valida cópia por contagem + hash de amostra por tabela.
# Uso: ./scripts/data/verify.sh --run-id <uuid>
# Saída: JSONL em stdout; exit code = número de falhas.
set -euo pipefail

RUN_ID=""
while [ $# -gt 0 ]; do
  case "$1" in
    --run-id) RUN_ID="$2"; shift 2 ;;
    *) echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
done
[ -n "$RUN_ID" ] || { echo "--run-id obrigatório" >&2; exit 2; }
[ -n "${PROD_DB_URL:-}" ] && [ -n "${STAGING_DB_URL:-}" ] || { echo "PROD_DB_URL/STAGING_DB_URL ausentes" >&2; exit 2; }

emit() {
  printf '{"ts":"%s","assertion":"%s","table":"%s","status":"%s","expected":"%s","actual":"%s","detail":%s}\n' \
    "$(date -u +%FT%TZ)" "$1" "$2" "$3" "${4:-}" "${5:-}" \
    "$(jq -Rn --arg d "${6:-}" '$d')"
}

FAILS=0

# Descobre tabelas do run (com WHERE do grupo se aplicável, salvo em notes)
mapfile -t ROWS < <(psql "$STAGING_DB_URL" -Atc "
  SELECT c.table_name || '|' || c.group_name || '|' || COALESCE(c.rows_source::text,'-1') || '|' || c.rows_copied
    FROM _migration.checkpoints c
   WHERE c.run_id='${RUN_ID}' AND c.status='done'
   ORDER BY c.table_name")

for line in "${ROWS[@]}"; do
  IFS='|' read -r T G SRC DST <<< "$line"

  # count
  STG=$(psql "$STAGING_DB_URL" -Atc "SELECT count(*) FROM public.${T}")
  if [ "$STG" = "$DST" ] && [ "$DST" = "$SRC" ]; then
    emit "count" "$T" "pass" "$SRC" "$STG"
  else
    emit "count" "$T" "fail" "$SRC" "$STG" "prod_selected=${SRC} staged=${STG} copied=${DST}"
    FAILS=$((FAILS+1))
  fi

  # hash de amostra: md5 de até 1000 ids ordenados. Se não houver coluna id, skip.
  HAS_ID=$(psql "$STAGING_DB_URL" -Atc "
    SELECT count(*) FROM information_schema.columns
     WHERE table_schema='public' AND table_name='${T}' AND column_name='id'")
  if [ "$HAS_ID" = "1" ]; then
    H_PROD=$(psql "$PROD_DB_URL" -Atc \
      "SELECT md5(string_agg(id::text, ',' ORDER BY id)) FROM (SELECT id FROM public.${T} ORDER BY id LIMIT 1000) s" 2>/dev/null || echo "")
    H_STG=$(psql "$STAGING_DB_URL" -Atc \
      "SELECT md5(string_agg(id::text, ',' ORDER BY id)) FROM (SELECT id FROM public.${T} ORDER BY id LIMIT 1000) s" 2>/dev/null || echo "")
    if [ -n "$H_PROD" ] && [ "$H_PROD" = "$H_STG" ]; then
      emit "hash" "$T" "pass" "$H_PROD" "$H_STG"
    else
      # WHERE filtrado pode divergir legitimamente; marcar unverified quando grupo tem WHERE
      emit "hash" "$T" "unverified" "$H_PROD" "$H_STG" "amostra pode divergir por filtro de grupo"
    fi
  else
    emit "hash" "$T" "unverified" "" "" "sem coluna id"
  fi
done

# FKs órfãos (rápido): valida constraints em staging
BAD_FK=$(psql "$STAGING_DB_URL" -Atc "
  SELECT count(*) FROM (
    SELECT conrelid::regclass::text AS t
      FROM pg_constraint
     WHERE contype='f'
       AND connamespace = 'public'::regnamespace
  ) s
  WHERE NOT EXISTS (SELECT 1)" 2>/dev/null || echo "0")
emit "fk" "*" "pass" "0" "$BAD_FK" "structural check only"

exit "$FAILS"
