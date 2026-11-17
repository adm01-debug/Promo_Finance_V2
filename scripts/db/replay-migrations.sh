#!/usr/bin/env bash
# Replay das migrations do zero num Postgres local efêmero.
#
# Responde à issue #90: "o replay do zero não completa". Com este harness o
# replay completa — o que faltava era reproduzir o ambiente da plataforma
# Supabase e rodar CADA arquivo em UMA transação, como o `supabase db push` faz.
#
# Uso:  bash scripts/db/replay-migrations.sh
# Saída: lista de falhas (arquivo|erro) e o resumo aplicados/falharam/total.
# Requisitos: postgresql-16 (initdb, pg_ctl, psql). Não precisa de rede.
set -uo pipefail

PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
DATA=${DATA:-/var/tmp/replaydb}
SOCK=${SOCK:-/var/tmp/pgs}   # curto de propósito: socket unix tem limite de 107 bytes
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGR="$REPO/supabase/migrations"
BOOT="$REPO/scripts/db/replay-bootstrap.sql"
RUNAS=${RUNAS:-postgres}     # Postgres recusa rodar como root

export PATH="$PGBIN:$PATH"

if [ ! -d "$DATA/base" ]; then
  rm -rf "$DATA" "$SOCK"; mkdir -p "$DATA" "$SOCK"
  chown "$RUNAS:$RUNAS" "$DATA" "$SOCK" 2>/dev/null || true
  su "$RUNAS" -c "$PGBIN/initdb -D $DATA -U postgres --auth=trust" >/dev/null || exit 1
  # pg_stat_statements é exigido por migrations de telemetria
  echo "shared_preload_libraries = 'pg_stat_statements'" >> "$DATA/postgresql.conf"
fi

pg_isready -h "$SOCK" -p 5433 -q 2>/dev/null || \
  su "$RUNAS" -c "$PGBIN/pg_ctl -D $DATA -o \"-k $SOCK -p 5433 -c listen_addresses=''\" -l $DATA/pg.log start" >/dev/null
sleep 3

psql -h "$SOCK" -p 5433 -U postgres -q -c "DROP DATABASE IF EXISTS replay;" >/dev/null 2>&1
psql -h "$SOCK" -p 5433 -U postgres -q -c "CREATE DATABASE replay;"        >/dev/null 2>&1
if ! psql -h "$SOCK" -p 5433 -U postgres -d replay -q -v ON_ERROR_STOP=1 -f "$BOOT" >/dev/null 2>&1; then
  echo "bootstrap falhou — veja $DATA/pg.log" >&2; exit 1
fi

N=0; F=0
for f in "$MIGR"/*.sql; do
  N=$((N + 1))
  # --single-transaction: o CLI do Supabase aplica cada migration numa transação.
  # Sem isso, CREATE TEMP TABLE ... ON COMMIT DROP morre no commit do próprio CREATE
  # e o arquivo falha por um motivo que não existe em produção.
  if ! OUT=$(psql -h "$SOCK" -p 5433 -U postgres -d replay -q --single-transaction \
               -v ON_ERROR_STOP=1 -f "$f" 2>&1); then
    F=$((F + 1))
    echo "FALHA ${f##*/}: $(echo "$OUT" | grep -m1 'ERROR:' | sed 's/.*ERROR:  //')"
  fi
done
echo "aplicados=$((N - F))  falharam=$F  total=$N"
[ "$F" -eq 0 ] || exit 1
