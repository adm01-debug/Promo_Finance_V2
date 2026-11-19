#!/usr/bin/env bash
# Gate #26 — Drift de schema/policies vs. baseline versionado.
#
# Compara o estado real do banco (PROD_DB_URL, somente leitura) com os
# baselines em scripts/integrity/baseline/. Qualquer PR que altere schema,
# policies ou views sem regerar os baselines no mesmo PR falha aqui.
#
# Env:
#   PROD_DB_URL        obrigatório (connection string somente leitura)
#   DRIFT_TOLERANCE    opcional, default 0 — divergência absoluta tolerada
#                      em contagens de índices (índices podem ser criados
#                      concorrentemente por manutenção)
#
# Exit: 0 sem drift | 1 drift detectado | 2 pré-condição ausente
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Uso: $(basename "$0") [-h|--help]"
  echo ""
  echo "Opcoes:"
  echo "  -h, --help   Exibe esta ajuda"
  echo ""
  echo "Gate #26 — Detecta drift de schema/policies vs. baseline versionado."
  echo "Env obrigatório: PROD_DB_URL"
  echo "Env opcional:    DRIFT_TOLERANCE (default: 0)"
  exit 0
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/integrity"
BASELINE="$DIR/baseline"
TOL="${DRIFT_TOLERANCE:-0}"

if [ -z "${PROD_DB_URL:-}" ]; then
  echo "::warning::PROD_DB_URL ausente — Gate #26 pulado."
  exit 2
fi

for bin in psql jq; do
  command -v "$bin" >/dev/null || { echo "ERRO: '$bin' não encontrado"; exit 2; }
done

# Tolerância não numérica fazia o `[ -gt ]` errar e cair no ramo "ok" — drift de índice aprovado.
if ! [[ "$TOL" =~ ^[0-9]+$ ]]; then
  echo "::error::DRIFT_TOLERANCE deve ser inteiro >= 0 (recebido: '$TOL')."
  exit 2
fi

for base in schema-counts.json expected-policies.json allowed-public-tables.json allowed-anon-writes.json; do
  jq -e . "$BASELINE/$base" >/dev/null 2>&1 || {
    echo "::error::baseline ausente ou JSON inválido: $BASELINE/$base"
    exit 2
  }
done

# Falha de consulta não é drift (exit 1) nem "sem drift": o gate não rodou.
consulta_falhou() {
  echo "::error::Gate #26 — falha ao consultar o banco ($1). Nada foi comparado."
  exit 2
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAILS=0

fail() { echo "❌ $*"; FAILS=$((FAILS + 1)); }
ok()   { echo "✅ $*"; }

# ---------------------------------------------------------------------------
# 1. Contagens de objetos
# ---------------------------------------------------------------------------
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t -F, <<'SQL' > "$TMP/counts.csv" || consulta_falhou "contagens"
SELECT 'tables',    count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r';
SELECT 'views',     count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='v';
SELECT 'indexes',   count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='i';
SELECT 'functions', count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public';
SELECT 'policies',  count(*) FROM pg_policies WHERE schemaname='public';
SQL

VISTOS=" "
while IFS=, read -r key actual; do
  [ -z "$key" ] && continue
  VISTOS="$VISTOS$key "
  expected="$(jq -r --arg k "$key" '.[$k] // "null"' "$BASELINE/schema-counts.json")"
  if [ "$expected" = "null" ]; then
    fail "counts.$key ausente no baseline (atual=$actual)"
    continue
  fi
  # Valor não numérico dentro de $(( )) vira nome de variável (= 0) e o drift some.
  if ! [[ "$actual" =~ ^[0-9]+$ && "$expected" =~ ^[0-9]+$ ]]; then
    fail "counts.$key não numérico: baseline='$expected' atual='$actual'"
    continue
  fi
  diff=$(( actual > expected ? actual - expected : expected - actual ))
  allowed=0
  [ "$key" = "indexes" ] && allowed="$TOL"
  if [ "$diff" -gt "$allowed" ]; then
    fail "counts.$key drift: baseline=$expected atual=$actual (Δ=$diff)"
  else
    ok "counts.$key = $actual"
  fi
done < "$TMP/counts.csv"
# Contagem que o banco não devolveu não foi comparada — não pode passar calada.
while IFS= read -r key; do
  case "$VISTOS" in
    *" $key "*) ;;
    *) fail "counts.$key está no baseline mas não veio do banco" ;;
  esac
done < <(jq -r 'keys[]' "$BASELINE/schema-counts.json")

# ---------------------------------------------------------------------------
# 2. Policies por tabela (tabelas novas/removidas e mudança de contagem)
# ---------------------------------------------------------------------------
FALHAS_ANTES_POLICIES="$FAILS"
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -A -t <<'SQL' > "$TMP/policies.json" || consulta_falhou "policies"
SELECT COALESCE(jsonb_object_agg(tablename, cnt), '{}'::jsonb)::text FROM (
  SELECT tablename, count(*) AS cnt FROM pg_policies
  WHERE schemaname='public' GROUP BY tablename
) t;
SQL

jq -e 'type == "object"' "$TMP/policies.json" >/dev/null 2>&1 || consulta_falhou "policies: resposta não é objeto JSON"

DRIFT="$(jq -n \
  --slurpfile base <(jq -c . "$BASELINE/expected-policies.json") \
  --slurpfile live <(jq -c . "$TMP/policies.json") '
  ($base[0]) as $b | ($live[0]) as $l |
  {
    added:    [ ($l | keys[]) as $k | select(($b | has($k)) | not) | $k ],
    removed:  [ ($b | keys[]) as $k | select(($l | has($k)) | not) | $k ],
    changed:  [ ($b | keys[]) as $k
                  | select(($l | has($k)) and $l[$k] != $b[$k])
                  | "\($k): \($b[$k]) -> \($l[$k])" ]
  }')"

for field in added removed changed; do
  n="$(jq -r --arg f "$field" '.[$f] | length' <<<"$DRIFT")"
  if [ "$n" -gt 0 ]; then
    fail "policies.$field ($n): $(jq -r --arg f "$field" '.[$f] | join(", ")' <<<"$DRIFT")"
  fi
done
[ "$FAILS" -eq "$FALHAS_ANTES_POLICIES" ] && ok "policies por tabela idênticas ao baseline"

# ---------------------------------------------------------------------------
# 3. Invariantes estruturais que nunca podem regredir
# ---------------------------------------------------------------------------
RLS_OFF="$(psql "$PROD_DB_URL" -A -t -c "
  SELECT COALESCE(string_agg(c.relname, ','), '')
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity;")" || consulta_falhou "RLS"
[ -n "$RLS_OFF" ] && fail "tabelas sem RLS: $RLS_OFF" || ok "RLS habilitado em 100% das tabelas"

VIEWS_BAD="$(psql "$PROD_DB_URL" -A -t -c "
  SELECT COALESCE(string_agg(c.relname, ','), '')
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='v'
    AND COALESCE((SELECT option_value FROM pg_options_to_table(c.reloptions)
                  WHERE option_name='security_invoker'), 'off') NOT IN ('on','true');")" || consulta_falhou "views"
[ -n "$VIEWS_BAD" ] && fail "views sem security_invoker: $VIEWS_BAD" \
                    || ok "todas as views com security_invoker"

ALLOWED_JSON="$(cat "$BASELINE/allowed-public-tables.json")"
ALLOWED_WRITES_JSON="$(cat "$BASELINE/allowed-anon-writes.json")"
_anon_sql="$TMP/anon.sql"
cat > "$_anon_sql" <<'SQL'
WITH allowed_select AS (
  SELECT jsonb_array_elements_text(:'allowed_json'::jsonb) AS tbl
), allowed_write AS (
  SELECT jsonb_array_elements_text(:'allowed_writes_json'::jsonb) AS exc
)
SELECT COALESCE(string_agg(DISTINCT table_name || ':' || privilege_type, ','), '')
FROM information_schema.role_table_grants g
WHERE table_schema='public' AND grantee='anon'
  AND NOT (
    (g.privilege_type = 'SELECT' AND g.table_name IN (SELECT tbl FROM allowed_select))
    OR (g.table_name || ':' || g.privilege_type IN (SELECT exc FROM allowed_write))
  );
SQL
ANON_BAD="$(psql "$PROD_DB_URL" -A -t -v ON_ERROR_STOP=1 \
  -v "allowed_json=$ALLOWED_JSON" \
  -v "allowed_writes_json=$ALLOWED_WRITES_JSON" \
  -f "$_anon_sql")" || consulta_falhou "grants de anon"
rm -f "$_anon_sql"
[ -n "$ANON_BAD" ] && fail "grants indevidos para anon: $ANON_BAD" \
                   || ok "anon sem privilégios fora da allowlist"

echo "──"
if [ "$FAILS" -gt 0 ]; then
  echo "::error::Gate #26 — $FAILS divergência(s) de baseline. Regere com scripts/integrity/dump-baseline.sh e commite no mesmo PR."
  exit 1
fi
echo "✅ Gate #26 — sem drift de schema/policies."
