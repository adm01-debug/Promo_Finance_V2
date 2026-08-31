#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

fail=0

check_absent() {
  local pattern="$1"
  shift
  if rg -n "$pattern" "$@"; then
    fail=1
  fi
}

echo "Verificando replay safety das migrations críticas..."

check_absent '^[[:space:]]*ALTER DATABASE[[:space:]]+postgres[[:space:]]+SET[[:space:]]+"app\.jwt_secret"' \
  supabase/migrations/001_create_tables.sql

# O schema `auth` é gerenciado pelo Supabase e não concede CREATE ao papel de
# migrations do Preview. Helpers do projeto devem permanecer em `public` ou
# `private`; `auth.uid()` já é fornecida pela plataforma.
check_absent '^[[:space:]]*CREATE([[:space:]]+OR[[:space:]]+REPLACE)?[[:space:]]+FUNCTION[[:space:]]+auth\.' \
  supabase/migrations

check_absent 'AS \$\$' \
  supabase/migrations/20260826010000_restaurar_exec_sql_wrapper_e03.sql

check_absent '^[[:space:]]*INSERT[[:space:]]+INTO[[:space:]]+supabase_migrations\.schema_migrations' \
  supabase/migrations/20260826030000_add_colunas_ausentes_e30.sql \
  supabase/migrations/20260826040000_fechar_policies_abertas_e06_e08.sql \
  supabase/migrations/20260826050000_revoke_execute_authenticated_e09.sql

if [[ "$fail" -ne 0 ]]; then
  echo "Falha: replay safety violado nas migrations críticas." >&2
  exit 1
fi

echo "OK: nenhum DDL proibido em auth, ALTER DATABASE inseguro ou escrita manual de ledger."
