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

check_present() {
  local pattern="$1"
  shift
  if ! rg -n "$pattern" "$@" >/dev/null; then
    echo "Padrão obrigatório ausente: $pattern" >&2
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

# O replay completo reaplica `001_create_tables.sql` e `003_seed_data.sql` antes
# da migration histórica consolidada de 2025. Esses triggers precisam ser
# idempotentes para não quebrar Preview/DB reset com "trigger ... already
# exists".
check_absent '^[[:space:]]*CREATE[[:space:]]+TRIGGER[[:space:]]+update_(fornecedores|clientes|contas_pagar|contas_receber)_updated_at\b' \
  supabase/migrations/20251214170739_b7e0e8b0-39a4-42c5-844e-0a57a5e3916d.sql

check_absent '^[[:space:]]*CREATE[[:space:]]+TRIGGER[[:space:]]+on_auth_user_created\b' \
  supabase/migrations/20251214170739_b7e0e8b0-39a4-42c5-844e-0a57a5e3916d.sql

check_absent '^[[:space:]]*CREATE[[:space:]]+TRIGGER[[:space:]]+update_categorias_updated_at\b' \
  supabase/migrations/20260317000749_a5a47522-0909-46d5-bc2e-1ee69a61a744.sql

# As migrations legadas de performance precisam respeitar os contratos atuais
# (`data_vencimento`) e não podem depender de tabelas já removidas do replay.
check_absent '\bcontas_(pagar|receber)\(vencimento\)\b' \
  supabase/migrations/20251231000001_performance_indexes.sql \
  supabase/migrations/20251231000100_add_performance_indexes.sql

check_absent '^[[:space:]]*(ON|ANALYZE)[[:space:]]+conciliacao_bancaria\b' \
  supabase/migrations/20251231000100_add_performance_indexes.sql

# Políticas condicionais precisam proteger relações ausentes no ponto histórico
# do replay (`workflow_aprovacoes` nunca é criada; `contratos` surge em maio).
check_absent '^[[:space:]]*DROP[[:space:]]+POLICY.*ON[[:space:]]+public\.(workflow_aprovacoes|contratos)[[:space:]]*;' \
  supabase/migrations/20260314213748_9f7b6de3-00ed-4be1-a331-21da0a4ce4d2.sql \
  supabase/migrations/20260314213926_4aa99b17-ffa7-44c9-a6c4-3b1c6d00ffae.sql

check_present 'CREATE[[:space:]]+TABLE[[:space:]]+IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+public\.plano_contas' \
  supabase/migrations/20260317000749_a5a47522-0909-46d5-bc2e-1ee69a61a744.sql

check_present 'contas_pagar[[:space:]]+ADD[[:space:]]+COLUMN[[:space:]]+IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+valor_pago' \
  supabase/migrations/20260317000844_6d9ca04a-21f2-481d-a362-2bba54383b46.sql

check_present 'contas_receber[[:space:]]+ADD[[:space:]]+COLUMN[[:space:]]+IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+valor_recebido' \
  supabase/migrations/20260317000844_6d9ca04a-21f2-481d-a362-2bba54383b46.sql

check_absent '^[[:space:]]*(ALTER[[:space:]]+TABLE.*GENERATED[[:space:]]+ALWAYS[[:space:]]+AS|CREATE([[:space:]]+OR[[:space:]]+REPLACE)?[[:space:]]+FUNCTION[[:space:]]+public\.(fn_sync_valor_|fn_transferencia_movimentacao)|CREATE[[:space:]]+TRIGGER[[:space:]]+(trg_sync_valor_|trg_transferencia_movimentacao|trg_auditoria_))' \
  supabase/migrations/20260317000928_196c5fd2-d3a0-4ea5-8042-5aa6ba14e479.sql

if [[ "$fail" -ne 0 ]]; then
  echo "Falha: replay safety violado nas migrations críticas." >&2
  exit 1
fi

echo "OK: nenhum DDL proibido em auth, ALTER DATABASE inseguro, escrita manual de ledger ou trigger histórico não idempotente."
