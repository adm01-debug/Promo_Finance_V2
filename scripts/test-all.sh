#!/usr/bin/env bash
# test-all.sh — roda TODAS as suítes de teste dos scripts em scripts/ e resume o resultado.
#
# Descobre as suítes pela convenção do repo, sem lista fixa (suíte nova entra sozinha):
#   - scripts/**/*.unit.mjs e *.test.mjs  → node --test <arquivo>
#   - scripts/**/test_*.py                → python3 -m unittest discover -s <pasta> -p 'test_*.py'
#   - scripts/ai-context/cenarios.mjs     → node <arquivo> (bateria de cenários do gerador de contexto)
#
# Uso:
#   bash scripts/test-all.sh                 # roda tudo
#   bash scripts/test-all.sh --list          # só lista as suítes descobertas
#   bash scripts/test-all.sh --only graphify # roda as suítes cujo caminho contém o texto
#
# Exit: 0 = todas verdes · 1 = alguma suíte falhou ou nenhuma suíte casou · 2 = uso inválido/ferramenta ausente.
# Não acessa rede nem banco de produção: as suítes usam stubs, fixtures e servidores locais efêmeros.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 2

LIST_ONLY=0
ONLY=""

usage() { sed -n '2,15p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

while [ $# -gt 0 ]; do
  case "$1" in
    --list) LIST_ONLY=1; shift ;;
    --only)
      [ $# -ge 2 ] && [ -n "$2" ] || { echo "erro: --only exige um texto" >&2; exit 2; }
      ONLY="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "erro: argumento desconhecido: $1 (use --help)" >&2; exit 2 ;;
  esac
done

for tool in node python3; do
  command -v "$tool" >/dev/null 2>&1 || { echo "erro: '$tool' não encontrado no PATH" >&2; exit 2; }
done

# Cada suíte é "tipo|alvo". Ordenação fixa (LC_ALL=C) para a saída ser determinística.
SUITES=()
while IFS= read -r f; do SUITES+=("node|$f"); done < <(
  find scripts \( -name '*.unit.mjs' -o -name '*.test.mjs' \) -type f | LC_ALL=C sort
)
[ -f scripts/ai-context/cenarios.mjs ] && SUITES+=("cenarios|scripts/ai-context/cenarios.mjs")
while IFS= read -r d; do SUITES+=("python|$d"); done < <(
  find scripts -name 'test_*.py' -type f -exec dirname {} \; | LC_ALL=C sort -u
)

if [ -n "$ONLY" ]; then
  FILTRADAS=()
  for s in "${SUITES[@]}"; do
    case "${s#*|}" in *"$ONLY"*) FILTRADAS+=("$s") ;; esac
  done
  SUITES=("${FILTRADAS[@]+"${FILTRADAS[@]}"}")
fi

if [ "${#SUITES[@]}" -eq 0 ]; then
  echo "erro: nenhuma suíte encontrada${ONLY:+ para --only '$ONLY'}" >&2
  exit 1
fi

if [ "$LIST_ONLY" -eq 1 ]; then
  for s in "${SUITES[@]}"; do printf '%-9s %s\n' "${s%%|*}" "${s#*|}"; done
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

export PYTHONDONTWRITEBYTECODE=1
# Evita que cor/TTY do runner mude a saída capturada.
export NO_COLOR=1 FORCE_COLOR=0

PASS=0
FAIL=0
FALHAS=()
INICIO=$SECONDS

for s in "${SUITES[@]}"; do
  tipo="${s%%|*}"
  alvo="${s#*|}"
  log="$TMP/saida.log"
  t0=$SECONDS
  case "$tipo" in
    node) node --test "$alvo" >"$log" 2>&1 ;;
    cenarios) node "$alvo" >"$log" 2>&1 ;;
    python) python3 -m unittest discover -s "$alvo" -p 'test_*.py' >"$log" 2>&1 ;;
  esac
  rc=$?
  dur=$((SECONDS - t0))
  if [ "$rc" -eq 0 ]; then
    PASS=$((PASS + 1))
    printf '✓ %-9s %s (%ss)\n' "$tipo" "$alvo" "$dur"
  else
    FAIL=$((FAIL + 1))
    FALHAS+=("$alvo")
    printf '✗ %-9s %s (%ss, exit %s)\n' "$tipo" "$alvo" "$dur" "$rc"
    # Só o fim da saída: é onde node --test e unittest põem o resumo da falha.
    tail -n 40 "$log" | sed 's/^/    /'
  fi
done

echo
echo "suítes: $((PASS + FAIL)) · verdes: $PASS · falhas: $FAIL · $((SECONDS - INICIO))s"
if [ "$FAIL" -gt 0 ]; then
  for f in "${FALHAS[@]}"; do echo "  falhou: $f"; done
  exit 1
fi
