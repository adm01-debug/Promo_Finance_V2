#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Uso: $(basename "$0") [-h|--help]"
  echo ""
  echo "Opcoes:"
  echo "  -h, --help   Exibe esta ajuda"
  echo ""
  echo "Verifica segurança de replay das migrations (padrões proibidos em DDL)."
  echo "Não requer banco de dados — analisa arquivos locais em supabase/migrations/."
  exit 0
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

fail=0

# PCRE só é usado no passe multilinha; sem ele (grep BSD) vale o passe por linha.
has_pcre=0
if printf 'a' | grep -qP 'a' 2>/dev/null; then
  has_pcre=1
fi

check_absent() {
  local pattern="$1"
  local status
  shift
  # -i: SQL não diferencia caixa — `create function auth.x` é o mesmo DDL.
  if grep -nERi -- "$pattern" "$@"; then
    fail=1
    return 0
  else
    status=$?
    if [[ "$status" -ne 1 ]]; then
      echo "Falha: não foi possível verificar o padrão '$pattern'." >&2
      exit "$status"
    fi
  fi
  # Statement quebrado em várias linhas: com o arquivo inteiro como um único
  # registro (-z) o `[[:space:]]` atravessa a quebra. O lookbehind faz o papel
  # do `^` por linha (versões antigas do grep recusam `^` com -Pz).
  local multiline="$pattern"
  if [[ "$pattern" == ^* ]]; then
    multiline="(?<![^\n])${pattern#^}"
  fi
  if [[ "$has_pcre" -eq 1 ]]; then
    if grep -lRPzi -- "$multiline" "$@"; then
      echo "  ^ DDL proibido quebrado em várias linhas no(s) arquivo(s) acima." >&2
      fail=1
    else
      status=$?
      if [[ "$status" -ne 1 ]]; then
        echo "Falha: não foi possível verificar o padrão multilinha '$pattern'." >&2
        exit "$status"
      fi
    fi
  fi
}

# Espelho de check_absent: há DDL cuja AUSÊNCIA quebra o replay. A migration
# consolidada de 2026-03 precisa criar a tabela antes que as migrations
# seguintes a referenciem.
check_present() {
  local pattern="$1"
  local status=0
  shift
  # $? tem de ser capturado na mesma linha do grep: depois de `fi` ele ja vale
  # o do proprio `if` (0 quando a condicao e falsa), e o guarda saia com
  # exit 0 -- ou seja, padrao obrigatorio ausente passava no CI.
  grep -qERi -- "$pattern" "$@" || status=$?
  if [[ "$status" -eq 0 ]]; then
    return 0
  fi
  if [[ "$status" -ne 1 ]]; then
    echo "Falha: não foi possível verificar o padrão obrigatório '$pattern'." >&2
    exit "$status"
  fi
  echo "Padrão obrigatório ausente: $pattern" >&2
  fail=1
}

echo "Verificando replay safety das migrations críticas..."

check_absent '^[[:space:]]*ALTER[[:space:]]+DATABASE[[:space:]]+"?postgres"?[[:space:]]+SET[[:space:]]+"?app\.jwt_secret' \
  supabase/migrations/001_create_tables.sql

# O schema `auth` é gerenciado pelo Supabase e não concede CREATE ao papel de
# migrations do Preview. Helpers do projeto devem permanecer em `public` ou
# `private`; `auth.uid()` já é fornecida pela plataforma.
check_absent '^[[:space:]]*CREATE([[:space:]]+OR[[:space:]]+REPLACE)?[[:space:]]+(FUNCTION|PROCEDURE)[[:space:]]+"?auth"?[[:space:]]*\.' \
  supabase/migrations

check_absent '\bAS[[:space:]]+\$\$' \
  supabase/migrations/20260826010000_restaurar_exec_sql_wrapper_e03.sql

check_absent '^[[:space:]]*(INSERT[[:space:]]+INTO|UPDATE|DELETE[[:space:]]+FROM)[[:space:]]+"?supabase_migrations"?[[:space:]]*\.[[:space:]]*"?schema_migrations' \
  supabase/migrations/20260826030000_add_colunas_ausentes_e30.sql \
  supabase/migrations/20260826040000_fechar_policies_abertas_e06_e08.sql \
  supabase/migrations/20260826050000_revoke_execute_authenticated_e09.sql

# O replay completo reaplica `001_create_tables.sql` e `003_seed_data.sql` antes
# da migration histórica consolidada de 2025. Esses triggers precisam ser
# idempotentes para não quebrar Preview/DB reset com "trigger ... already
# exists".
check_absent '^[[:space:]]*CREATE[[:space:]]+TRIGGER[[:space:]]+"?update_(fornecedores|clientes|contas_pagar|contas_receber)_updated_at\b' \
  supabase/migrations/20251214170739_b7e0e8b0-39a4-42c5-844e-0a57a5e3916d.sql

check_absent '^[[:space:]]*CREATE[[:space:]]+TRIGGER[[:space:]]+"?on_auth_user_created\b' \
  supabase/migrations/20251214170739_b7e0e8b0-39a4-42c5-844e-0a57a5e3916d.sql

# As migrations legadas de performance precisam respeitar o contrato atual da
# coluna (`data_vencimento`) e não podem depender de relação já removida do
# replay — as duas formas já quebraram o replay uma vez.
check_absent '\bcontas_(pagar|receber)\(vencimento\)\b' \
  supabase/migrations/20251231000001_performance_indexes.sql \
  supabase/migrations/20251231000100_add_performance_indexes.sql

check_absent '^[[:space:]]*(ON|ANALYZE)[[:space:]]+conciliacao_bancaria\b' \
  supabase/migrations/20251231000100_add_performance_indexes.sql

# DROP POLICY nua sobre relação que não existe no ponto histórico do replay:
# `workflow_aprovacoes` nunca é criada e `contratos` só aparece em maio.
check_absent '^[[:space:]]*DROP[[:space:]]+POLICY.*ON[[:space:]]+public\.(workflow_aprovacoes|contratos)[[:space:]]*;' \
  supabase/migrations/20260314213748_9f7b6de3-00ed-4be1-a331-21da0a4ce4d2.sql \
  supabase/migrations/20260314213926_4aa99b17-ffa7-44c9-a6c4-3b1c6d00ffae.sql

# Contrapartida: as migrations de 2026-03 em diante referenciam plano_contas,
# que precisa continuar sendo criada aqui.
check_present 'CREATE[[:space:]]+TABLE[[:space:]]+IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+public\.plano_contas' \
  supabase/migrations/20260317000749_a5a47522-0909-46d5-bc2e-1ee69a61a744.sql

# ── Bloqueios do replay completo fechados pela PR #399 ───────────────────
# Cada um destes abortou a cadeia inteira uma vez, deixando o schema pela
# metade. O replay completo precisa de um Postgres descartavel e nao roda
# neste script; os guardas abaixo travam a reincidencia na forma exata que
# quebrou, no arquivo exato.

# CREATE OR REPLACE nao renomeia parametro de entrada: a cadeia cria
# faixa_simples_reparticao_valida(_rep jsonb) antes (20260728124719:42,
# 20260825110000) e a producao usa p_reparticao. Sem o DROP da funcao -- e do
# CHECK que depende dela -- o arquivo morre em "cannot change name of input
# parameter".
check_present 'DROP[[:space:]]+FUNCTION[[:space:]]+IF[[:space:]]+EXISTS[[:space:]]+public\.faixa_simples_reparticao_valida\([[:space:]]*jsonb[[:space:]]*\)' \
  supabase/migrations/20260825250000_recreate_6_constraints.sql

# Com o arquivo acima chegando ao fim, C3 e C5 passaram a ser alcancados e
# quebravam em "constraint ... already exists": ADD CONSTRAINT sem DROP antes.
check_present 'DROP[[:space:]]+CONSTRAINT[[:space:]]+IF[[:space:]]+EXISTS[[:space:]]+protocolos_st_ncms_mva_range_chk' \
  supabase/migrations/20260825250000_recreate_6_constraints.sql

check_present 'DROP[[:space:]]+CONSTRAINT[[:space:]]+IF[[:space:]]+EXISTS[[:space:]]+elisao_regras_creditos_aliquota_check' \
  supabase/migrations/20260825250000_recreate_6_constraints.sql

# REVOKE sobre funcao inexistente aborta o arquivo todo. A producao tem os dois
# overloads de watch_cron_failures; a cadeia so cria (integer, integer), entao o
# overload sem argumentos depende da guarda de existencia.
check_present "to_regprocedure\('public\.watch_cron_failures\(\)'\)" \
  supabase/migrations/20260826050000_revoke_execute_authenticated_e09.sql

# cron_job_logs sem success/created_at derruba o preflight de 20260831153000 --
# e a tabela nesse formato rejeitaria o INSERT que a Edge Function
# sefaz-dfe-dispatcher realmente faz (executed_at/duration_ms/success/result).
check_present 'ADD[[:space:]]+COLUMN[[:space:]]+IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+success[[:space:]]+boolean' \
  supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql

check_present 'ADD[[:space:]]+COLUMN[[:space:]]+IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+created_at[[:space:]]+timestamp' \
  supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql

# O CHECK de C5 referencia elisao_regras_creditos.aliquota, que a cadeia nao
# criava: la a tabela nasce com aliquota_pis_reducao/fundamentacao_legal.
check_present 'ADD[[:space:]]+COLUMN[[:space:]]+IF[[:space:]]+NOT[[:space:]]+EXISTS[[:space:]]+aliquota[[:space:]]+numeric' \
  supabase/migrations/20260825110000_reconciliar_schema_v3_completo.sql

# O DROP de 6 argumentos nao alcanca o overload legado de 4 -- e e por ele que
# 20261102000000 acusava "confirmar_conciliacao ainda existe".
check_present 'DROP[[:space:]]+FUNCTION[[:space:]]+IF[[:space:]]+EXISTS[[:space:]]+public\.confirmar_conciliacao\([[:space:]]*uuid,[[:space:]]*uuid,[[:space:]]*uuid,[[:space:]]*numeric[[:space:]]*\)' \
  supabase/migrations/20260902170000_fix_rpcs_security_definer_sem_escopo.sql

if [[ "$fail" -ne 0 ]]; then
  echo "Falha: replay safety violado nas migrations críticas." >&2
  exit 1
fi

echo "OK: nenhum DDL proibido em auth, ALTER DATABASE inseguro, escrita manual de ledger ou trigger histórico não idempotente."
