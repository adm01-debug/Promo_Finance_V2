#!/bin/sh
set -eu
# Falhas do próprio wrapper saem em JSON com exit 1: 2 é reservado a missing_dependencies.
die() {
  printf '%s\n' "{\"status\":\"failed\",\"message\":\"$1\"}"
  exit 1
}
[ -n "${HOME:-}" ] || die 'HOME indefinido ou vazio'
state="$HOME/.cache/repo-maintenance"
{ mkdir -p "$state" && chmod 700 "$state"; } 2>/dev/null || die 'Não foi possível criar o diretório da trava global'
if ! command -v flock >/dev/null 2>&1; then
  printf '%s\n' '{"status":"failed","message":"flock indisponível"}'
  exit 1
fi
command -v node >/dev/null 2>&1 || die 'node indisponível'
(: >>"$state/fleet.lock") 2>/dev/null || die 'Não foi possível abrir a trava global'
exec 9>"$state/fleet.lock"
if ! flock -n 9; then
  printf '%s\n' '{"status":"skipped_busy","message":"Trava global ocupada"}'
  exit 75
fi
exec node "$(dirname -- "$0")/run.mjs" "$@"
