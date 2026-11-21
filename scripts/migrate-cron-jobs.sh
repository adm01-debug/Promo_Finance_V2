#!/usr/bin/env bash
# scripts/migrate-cron-jobs.sh
# Wrapper: faz envsubst em migrate-cron-jobs.sql e aplica via psql no destino.
#
# Uso:
#   ./scripts/migrate-cron-jobs.sh [--dry-run]
#
# Env obrigatórias:
#   DEST_DB_URL=postgresql://postgres:<senha>@<host>:5432/postgres
#   PROJECT_REF=<ref do destino>
#   ANON_KEY=<anon key do destino>

set -euo pipefail

DRY_RUN=0
# Argumento desconhecido aborta: antes, um `--dryrun` digitado errado (ou
# `--dry-run` fora da 1ª posição) era ignorado e o SQL era APLICADO no banco.
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help)
      echo "Uso: $(basename "$0") [--dry-run] [-h|--help]"
      echo ""
      echo "Opcoes:"
      echo "  --dry-run    Simula execução sem aplicar mudanças no banco"
      echo "  -h, --help   Exibe esta ajuda"
      echo ""
      echo "Env obrigatório: DEST_DB_URL, PROJECT_REF, ANON_KEY"
      exit 0 ;;
    *) echo "Argumento desconhecido: $arg (use --help)" >&2; exit 2 ;;
  esac
done

: "${DEST_DB_URL:?DEST_DB_URL é obrigatório}"
: "${PROJECT_REF:?PROJECT_REF é obrigatório}"
: "${ANON_KEY:?ANON_KEY é obrigatório}"

command -v envsubst >/dev/null 2>&1 || { echo "envsubst não encontrado (pacote gettext)" >&2; exit 3; }
command -v psql     >/dev/null 2>&1 || { echo "psql não encontrado" >&2; exit 3; }

SRC="$(dirname "$0")/migrate-cron-jobs.sql"
[[ -f "$SRC" ]] || { echo "Arquivo $SRC não existe" >&2; exit 4; }

# Valor interpolado no SQL por envsubst com aspa, espaço ou quebra de linha
# vira SQL arbitrário executado no destino. Só é checado o placeholder que o
# SQL realmente usa — hoje nenhum, então um secret com "\n" final não bloqueia.
if grep -Eq '\$\{?PROJECT_REF\b' "$SRC" && [[ ! "$PROJECT_REF" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "PROJECT_REF inválido — use apenas letras, números, '-' e '_'" >&2; exit 2
fi
if grep -Eq '\$\{?ANON_KEY\b' "$SRC" && [[ ! "$ANON_KEY" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "ANON_KEY inválido — esperado JWT/chave publicável (letras, números, '.', '-' e '_')" >&2; exit 2
fi

# Fonte da contagem esperada: o próprio SQL (nada de número fixo aqui).
EXPECTED="$(grep -c '^SELECT cron\.schedule(' "$SRC" || true)"
[[ "$EXPECTED" -gt 0 ]] || { echo "Nenhum cron.schedule encontrado em $SRC" >&2; exit 4; }

TS="$(date -u +%Y%m%d-%H%M)"
# PID no nome + noclobber (O_EXCL): sem colisão no mesmo minuto e sem seguir
# symlink pré-plantado no diretório temporário.
OUT="${TMPDIR:-/tmp}/cron-final-${TS}-$$.sql"
LOG="${TMPDIR:-/tmp}/cron-apply-${TS}-$$.log"
( set -o noclobber; : > "$OUT" ) 2>/dev/null || { echo "Não foi possível criar $OUT" >&2; exit 4; }
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-15}"

# envsubst só nas duas variáveis esperadas (protege $cron$ e outros $$)
export PROJECT_REF ANON_KEY
envsubst '${PROJECT_REF} ${ANON_KEY}' < "$SRC" > "$OUT"

echo "📄 SQL renderizado: $OUT"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "🧪 DRY-RUN — nenhuma alteração aplicada. Preview abaixo:"
  echo "------------------------------------------------------------"
  sed -n '1,24p' "$OUT"
  echo "..."
  FIRST=$(grep -n '^SELECT cron.schedule(' "$OUT" | head -1 | cut -d: -f1)
  if [[ -n "$FIRST" ]]; then
    sed -n "${FIRST},$((FIRST+24))p" "$OUT"
  fi
  echo "... (truncado) ..."
  exit 0
fi

echo "🚀 Aplicando em $PROJECT_REF..."
( set -o noclobber; : > "$LOG" ) 2>/dev/null || { echo "Não foi possível criar $LOG" >&2; exit 4; }
psql -X "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f "$OUT" 2>&1 | tee "$LOG"

echo ""
echo "🔎 Validando cron.job..."
psql -X "$DEST_DB_URL" -c "SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;"

COUNT="$(psql -X "$DEST_DB_URL" -Atc "SELECT count(*) FROM cron.job;")"
echo ""
if [[ ! "$COUNT" =~ ^[0-9]+$ || "$COUNT" -lt "$EXPECTED" ]]; then
  echo "❌ Total de jobs no destino: ${COUNT:-?} (esperado ≥ $EXPECTED)" >&2
  echo "📝 Log: $LOG" >&2
  exit 1
fi
echo "✅ Total de jobs no destino: $COUNT (esperado ≥ $EXPECTED)"
echo "📝 Log: $LOG"
