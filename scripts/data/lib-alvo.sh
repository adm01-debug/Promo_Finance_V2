#!/usr/bin/env bash
# lib-alvo.sh — travas compartilhadas dos scripts de cópia de dados (usar via `source`).
#
# Os scripts desta pasta fazem TRUNCATE/INSERT no banco apontado por
# STAGING_DB_URL. Comparar só o texto das URLs não protege produção: a mesma
# base atende por URLs diferentes (pooler, porta, usuário, query string).

# Usadas por quem dá `source` neste arquivo.
# shellcheck disable=SC2034
RE_UUID='^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
# shellcheck disable=SC2034
RE_TABELA='^[a-z_][a-z0-9_]*$'
# shellcheck disable=SC2034
RE_GRUPO='^[A-Za-z0-9_-]+$'

# db_identidade <url> — imprime "<subida do postmaster>/<database>" do banco por
# trás da URL. O instante de subida do servidor é o mesmo por qualquer caminho
# de conexão e para qualquer role (em epoch, não depende do fuso da sessão);
# pg_control_system() seria mais direto, mas pode estar revogado para o role.
db_identidade() {
  psql "$1" -q -Atc "
    SELECT extract(epoch FROM pg_postmaster_start_time())::text || '/' || current_database()" 2>/dev/null
}

# recusa_alvo_producao <url_alvo> [url_prod] [ref_prod]
# Retorna 0 quando é seguro escrever no alvo; 1 (motivo em stderr) quando o alvo
# é produção ou quando não dá para provar que não é.
recusa_alvo_producao() {
  local alvo="$1" prod="${2:-}" ref_prod="${3:-}" id_alvo id_prod
  if [ -n "$ref_prod" ] && [[ "$alvo" == *"$ref_prod"* ]]; then
    echo "STAGING_DB_URL aponta para o projeto de produção (contém PROD_PROJECT_REF)" >&2
    return 1
  fi
  [ -n "$prod" ] || return 0
  if [ "$alvo" = "$prod" ]; then
    echo "PROD_DB_URL == STAGING_DB_URL" >&2
    return 1
  fi
  id_alvo="$(db_identidade "$alvo")" && [ -n "$id_alvo" ] || {
    echo "não foi possível conectar em STAGING_DB_URL para validar o alvo" >&2
    return 1
  }
  id_prod="$(db_identidade "$prod")" && [ -n "$id_prod" ] || {
    echo "não foi possível conectar em PROD_DB_URL para validar o alvo" >&2
    return 1
  }
  if [ "$id_alvo" = "$id_prod" ]; then
    echo "PROD_DB_URL e STAGING_DB_URL apontam para o mesmo banco (URLs diferentes, mesma base)" >&2
    return 1
  fi
  return 0
}
