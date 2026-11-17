#!/usr/bin/env bash
# Replay das migrations do zero num Postgres local efêmero.
#
# Responde à issue #90: "o replay do zero não completa". Com este harness o
# replay completa — o que faltava era reproduzir o ambiente da plataforma
# Supabase e rodar CADA arquivo em UMA transação, como o `supabase db push` faz.
#
# Uso:  bash scripts/db/replay-migrations.sh
# Saída: lista de falhas (arquivo|erro) e o resumo aplicados/falharam/total.
#
# Requisitos (checados antes de rodar; o script aborta nomeando o que falta):
#   - postgresql-16: initdb, pg_ctl, psql
#   - arquivos das extensões que as migrations instalam com CREATE EXTENSION sem
#     tratamento de erro: pg_cron, pg_net, uuid-ossp, pgcrypto, pg_stat_statements.
#     "postgresql-16" sozinho NÃO garante esses pacotes — em Debian/Ubuntu são
#     postgresql-16-cron, postgresql-16-pg-net e postgresql-contrib.
#     A biblioteca .so do pg_cron não é necessária: o replay só cria objetos SQL,
#     não roda o agendador.
# Não precisa de rede.
set -uo pipefail

PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
DATA=${DATA:-/var/tmp/replaydb}
SOCK=${SOCK:-/var/tmp/pgs}   # curto de propósito: socket unix tem limite de 107 bytes
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGR="$REPO/supabase/migrations"
BOOT="$REPO/scripts/db/replay-bootstrap.sql"
export PATH="$PGBIN:$PATH"

# Postgres recusa rodar como root. Só então trocamos de usuário; rodando como
# conta comum usamos a própria, porque `su` exigiria autenticação.
if [ "$(id -u)" -eq 0 ]; then
  RUNAS=${RUNAS:-postgres}
  as_pg() { su "$RUNAS" -c "$1"; }
else
  RUNAS=$(id -un)
  as_pg() { bash -c "$1"; }
fi

faltando=""
for ext in pg_cron pg_net uuid-ossp pgcrypto pg_stat_statements; do
  ls "$(pg_config --sharedir)/extension/$ext.control" >/dev/null 2>&1 || faltando="$faltando $ext"
done
if [ -n "$faltando" ]; then
  echo "abortando: faltam os arquivos destas extensões:$faltando" >&2
  echo "as migrations fazem CREATE EXTENSION delas sem tratamento de erro," >&2
  echo "logo o replay falharia. Instale-as e rode de novo." >&2
  exit 2
fi

if [ ! -d "$DATA/base" ]; then
  rm -rf "$DATA" "$SOCK"; mkdir -p "$DATA" "$SOCK"
  # 0700: o socket aceita conexão como superusuário sem senha (--auth=trust),
  # então só o dono pode alcançá-lo. Sem isso, qualquer conta local do host
  # conectaria como postgres neste banco.
  chmod 700 "$DATA" "$SOCK"
  chown "$RUNAS:$RUNAS" "$DATA" "$SOCK" 2>/dev/null || true
  as_pg "$PGBIN/initdb -D $DATA -U postgres --auth=trust" >/dev/null || exit 1
  # pg_stat_statements é exigido por migrations de telemetria
  echo "shared_preload_libraries = 'pg_stat_statements'" >> "$DATA/postgresql.conf"
fi

pg_isready -h "$SOCK" -p 5433 -q 2>/dev/null || \
  as_pg "$PGBIN/pg_ctl -D $DATA -o \"-k $SOCK -p 5433 -c listen_addresses=''\" -l $DATA/pg.log start" >/dev/null
sleep 3

# Sem abortar aqui, uma sessão aberta impede o DROP e o replay rodaria sobre o
# banco anterior — o resultado deixaria de ser "do zero" sem ninguém notar.
psql -h "$SOCK" -p 5433 -U postgres -d postgres -q -c "DROP DATABASE IF EXISTS replay;" \
  || { echo "não foi possível apagar o banco replay (sessão aberta?)" >&2; exit 1; }
psql -h "$SOCK" -p 5433 -U postgres -d postgres -q -c "CREATE DATABASE replay;" \
  || { echo "não foi possível criar o banco replay" >&2; exit 1; }
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
