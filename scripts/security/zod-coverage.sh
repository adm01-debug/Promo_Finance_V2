#!/usr/bin/env bash
# Zod coverage gate for Supabase Edge Functions.
# Emite a lista de funções que consomem `req.json()` sem passar por
# `validatePayload` (Zod contract). Falha quando a cobertura regride abaixo
# do baseline registrado em scripts/security/zod-coverage.baseline.
#
# Exit: 0 sem regressão · 1 regressão · 2 gate não pôde ser avaliado
# (baseline corrompido/ausente, supabase/functions sem nenhuma função).
# Testes: python3 scripts/security/test_gates_shell.py
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Uso: $(basename "$0") [-h|--help]"
  echo ""
  echo "Opcoes:"
  echo "  -h, --help   Exibe esta ajuda"
  echo ""
  echo "Verifica cobertura Zod nas Edge Functions. Falha se regredir abaixo do baseline."
  echo "Env opcional: BASELINE_FILE (default: scripts/security/zod-coverage.baseline)"
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FUNCS_DIR="$ROOT/supabase/functions"
DEFAULT_BASELINE_FILE="$ROOT/scripts/security/zod-coverage.baseline"
BASELINE_FILE="${BASELINE_FILE:-$DEFAULT_BASELINE_FILE}"

missing=()
total=0
for d in "$FUNCS_DIR"/*/; do
  name=$(basename "$d")
  [ "$name" = "_shared" ] && continue
  f="$d/index.ts"
  [ -f "$f" ] || continue
  total=$((total+1))
  # Linhas de comentário (`//`, `/*`, ` * `) não contam como leitura do corpo nem
  # como validação. O resultado fica em variável: com `pipefail`, um
  # `grep | grep -q` em arquivo grande morria de SIGPIPE e acusava falta de Zod
  # em função validada.
  code=$(grep -vE '^[[:space:]]*(//|/\*|\*)' "$f") || [ $? -eq 1 ]
  # Sem espaços: cobre a leitura quebrada em várias linhas (`req\n.clone()\n.json()`).
  compact=$(tr -d '[:space:]' <<<"$code")
  # `parseJsonBody(` conta como leitura do corpo: a função delega o
  # `req.json()` a `_shared/validation.ts`, e sem esta alternativa as funções
  # que a adotam sairiam do conjunto avaliado — o gate deixaria de cobri-las.
  if grep -qE '(req|request)(\.clone\(\))?\.json\(\)|parseJsonBody\(' <<<"$compact"; then
    # Exige a CHAMADA: só importar `_shared/validation` não valida nada.
    if ! grep -qE 'validatePayload\(|validateContract\(|\.safeParse\(' <<<"$compact"; then
      missing+=("$name")
    fi
  fi
done

# Sem nenhuma função avaliada o gate aprovaria o vazio (pasta movida/renomeada).
if [ "$total" -eq 0 ]; then
  echo "❌ Nenhuma Edge Function com index.ts em $FUNCS_DIR — gate não pode ser avaliado." >&2
  exit 2
fi

count=${#missing[@]}
echo "[zod-coverage] Total edge functions: $total"
echo "[zod-coverage] Sem validação Zod: $count"
for n in "${missing[@]}"; do echo "  - $n"; done

if [ -f "$BASELINE_FILE" ]; then
  # Só apara as pontas: remover todo espaço juntava "1 2" (ou duas linhas de um
  # merge mal resolvido) em "12" e afrouxava o gate sem aviso.
  baseline=$(sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' "$BASELINE_FILE")
  # Até 9 dígitos: acima disso o `[ -gt ]` falha com "integer expression
  # expected" e o `if` caía no ramo de sucesso.
  if ! [[ "$baseline" =~ ^[0-9]{1,9}$ ]]; then
    echo "❌ Baseline corrompido ou vazio em $BASELINE_FILE (valor: '$baseline')" >&2
    exit 2
  fi
  if [ "$count" -gt "$baseline" ]; then
    echo "❌ Regressão: cobertura Zod piorou ($count > baseline $baseline)"
    exit 1
  fi
  echo "✅ Sem regressão (baseline $baseline)"
  if [ "$count" -lt "$baseline" ]; then
    echo "ℹ️  Cobertura melhorou ($count < baseline $baseline): reduza o baseline para $count em $BASELINE_FILE"
  fi
elif [ "$BASELINE_FILE" = "$DEFAULT_BASELINE_FILE" ]; then
  # O baseline padrão é versionado: se sumiu, recriá-lo com a contagem atual
  # aprovaria qualquer regressão que viesse junto com a remoção do arquivo.
  echo "❌ Baseline versionado ausente em $BASELINE_FILE — restaure o arquivo (git checkout) em vez de recriá-lo." >&2
  exit 2
else
  echo "$count" > "$BASELINE_FILE"
  echo "ℹ️  Baseline criado: $count"
fi
