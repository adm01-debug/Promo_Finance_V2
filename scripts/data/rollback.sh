#!/usr/bin/env bash
# rollback.sh — restaura snapshots de um run em staging.
# Uso: ./scripts/data/rollback.sh --run-id <uuid> [--dry-run]
#
# Nunca executa automaticamente. Requer STAGING_DB_URL.
# Com PROD_DB_URL e/ou PROD_PROJECT_REF no ambiente, recusa rodar se o alvo
# for produção. Todas as tabelas voltam numa única transação: ou o run inteiro
# é restaurado, ou nada muda.
set -euo pipefail

RUN_ID=""; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --run-id) [ $# -ge 2 ] || { echo "flag --run-id exige um valor" >&2; exit 2; }
              RUN_ID="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "flag desconhecida: $1" >&2; exit 2 ;;
  esac
done

[ -n "$RUN_ID" ] || { echo "--run-id obrigatório" >&2; exit 2; }
[ -n "${STAGING_DB_URL:-}" ] || { echo "STAGING_DB_URL ausente" >&2; exit 2; }

# shellcheck source=scripts/data/lib-alvo.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib-alvo.sh"
# O run-id entra em SQL e no JSONL.
[[ "$RUN_ID" =~ $RE_UUID ]] || { echo "run-id inválido (esperado UUID): $RUN_ID" >&2; exit 2; }
recusa_alvo_producao "$STAGING_DB_URL" "${PROD_DB_URL:-}" "${PROD_PROJECT_REF:-}" || exit 2

emit() {
  printf '{"ts":"%s","run_id":"%s","table":"%s","status":"%s","detail":%s}\n' \
    "$(date -u +%FT%TZ)" "$RUN_ID" "${1:-}" "${2:-}" "$(jq -Rn --arg d "${3:-}" '$d')"
}

RUN_EXISTS=$(psql "$STAGING_DB_URL" -Atc \
  "SELECT count(*) FROM _migration.runs WHERE id='${RUN_ID}'")
[ "$RUN_EXISTS" = "1" ] || { echo "run_id não encontrado" >&2; exit 1; }

# Snapshot de tabelas afetadas. Entram também 'pending' e 'running': o TRUNCATE
# ... CASCADE de uma tabela-pai esvazia filhas que ainda nem foram copiadas, e
# um run interrompido no meio deixa checkpoint em 'running'.
LISTA=$(psql "$STAGING_DB_URL" -Atc "
  SELECT table_name || '|' || COALESCE(snapshot_table,'') || '|' || status
    FROM _migration.checkpoints
   WHERE run_id='${RUN_ID}' AND status IN ('pending','running','done','failed')
   ORDER BY table_name")
ROWS=()
[ -z "$LISTA" ] || mapfile -t ROWS <<< "$LISTA"

if [ "${#ROWS[@]}" -eq 0 ]; then
  echo "Nada a reverter para o run ${RUN_ID}"
  exit 0
fi

echo "→ Rollback do run ${RUN_ID} (${#ROWS[@]} tabelas)"
RESTAURAR=()
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
  RESTAURAR+=("$T|$SNAP")
done

if [ "$DRY" -eq 1 ]; then
  echo "✅ rollback concluído"
  exit 0
fi

# Uma transação para o run inteiro. Restaurar tabela a tabela com TRUNCATE
# CASCADE desfazia o que já tinha sido restaurado: ao truncar a tabela-pai, a
# filha restaurada um passo antes era esvaziada de novo. Aqui: trunca todas de
# uma vez e reinsere, adiando quem depende de pai ainda não restaurado (FK).
# Colunas geradas ficam fora do INSERT; identity ALWAYS entra com OVERRIDING.
if ! ERRO=$(psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -v VERBOSITY=terse -q 2>&1 >/dev/null <<SQL
BEGIN;
DO \$rb\$
DECLARE
  r record;
  pend text[] := '{}';
  prox text[];
  snaps jsonb := '{}';
  t text;
  cols text;
  progrediu boolean;
BEGIN
  FOR r IN
    SELECT table_name, snapshot_table
      FROM _migration.checkpoints
     WHERE run_id = '${RUN_ID}' AND snapshot_table IS NOT NULL
       AND status IN ('pending','running','done','failed')
     ORDER BY table_name
  LOOP
    IF r.table_name !~ '^[a-z_][a-z0-9_]*\$' OR r.snapshot_table !~ '^_migration\\.[a-z0-9_]+\$' THEN
      RAISE EXCEPTION 'checkpoint com nome inesperado: % / %', r.table_name, r.snapshot_table;
    END IF;
    IF to_regclass(r.snapshot_table) IS NULL THEN
      RAISE EXCEPTION 'snapshot ausente (removido pelo gc?): %', r.snapshot_table;
    END IF;
    IF to_regclass('public.' || r.table_name) IS NULL THEN
      RAISE EXCEPTION 'tabela ausente em staging: public.%', r.table_name;
    END IF;
    pend := pend || r.table_name;
    snaps := snaps || jsonb_build_object(r.table_name, r.snapshot_table);
  END LOOP;

  IF cardinality(pend) = 0 THEN
    RETURN;
  END IF;

  EXECUTE 'TRUNCATE ' || (SELECT string_agg(format('public.%I', x), ', ') FROM unnest(pend) x) || ' CASCADE';

  LOOP
    prox := '{}';
    progrediu := false;
    FOREACH t IN ARRAY pend LOOP
      SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum) INTO cols
        FROM pg_attribute
       WHERE attrelid = to_regclass('public.' || t)
         AND attnum > 0 AND NOT attisdropped AND attgenerated = '';
      BEGIN
        EXECUTE format('INSERT INTO public.%I (%s) OVERRIDING SYSTEM VALUE SELECT %s FROM %s',
                       t, cols, cols, snaps ->> t);
        progrediu := true;
      EXCEPTION WHEN foreign_key_violation THEN
        prox := prox || t;
      END;
    END LOOP;
    EXIT WHEN cardinality(prox) = 0;
    IF NOT progrediu THEN
      RAISE EXCEPTION 'FK impede restaurar (pai fora do run ou ciclo): %', array_to_string(prox, ', ');
    END IF;
    pend := prox;
  END LOOP;

  UPDATE _migration.checkpoints
     SET status = 'rolled_back', ended_at = now()
   WHERE run_id = '${RUN_ID}' AND snapshot_table IS NOT NULL
     AND status IN ('pending','running','done','failed');
END
\$rb\$;
UPDATE _migration.runs
   SET status='rolled_back', ended_at=now(),
       notes = COALESCE(notes,'') || E'\\nrolled_back at ' || now()
 WHERE id='${RUN_ID}';
COMMIT;
SQL
); then
  ERRO="$(printf '%s' "$ERRO" | tr '\n' ' ' | cut -c1-300)"
  for par in "${RESTAURAR[@]+"${RESTAURAR[@]}"}"; do
    emit "${par%%|*}" "failed" "$ERRO"
  done
  echo "❌ rollback falhou — transação revertida, staging ficou como estava: $ERRO" >&2
  exit 1
fi

for par in "${RESTAURAR[@]+"${RESTAURAR[@]}"}"; do
  emit "${par%%|*}" "restored" "${par#*|}"
done
echo "✅ rollback concluído"
