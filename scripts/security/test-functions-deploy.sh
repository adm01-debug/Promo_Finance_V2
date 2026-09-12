#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

CAPTURE="$TMP_DIR/supabase-args.log"
mkdir -p "$TMP_DIR/bin"

cat > "$TMP_DIR/bin/supabase" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$SUPABASE_TEST_CAPTURE"
MOCK
chmod +x "$TMP_DIR/bin/supabase"

cd "$ROOT"
PATH="$TMP_DIR/bin:$PATH" \
SUPABASE_TEST_CAPTURE="$CAPTURE" \
SUPABASE_ACCESS_TOKEN="sbp_teste" \
SUPABASE_PROJECT_REF="projeto_teste" \
bash scripts/migrate-functions.sh \
  --only "detectar-anomalias-financeiras,compare-schemas" >/dev/null

mapfile -t calls < "$CAPTURE"
[[ "${#calls[@]}" -eq 2 ]] || {
  echo "Falha: esperadas 2 chamadas da CLI; encontradas ${#calls[@]}." >&2
  exit 1
}

[[ "${calls[0]}" == \
  "functions deploy detectar-anomalias-financeiras --project-ref projeto_teste" ]] || {
  echo "Falha: função protegida recebeu argumentos inesperados: ${calls[0]}" >&2
  exit 1
}

[[ "${calls[1]}" == \
  "functions deploy compare-schemas --project-ref projeto_teste --no-verify-jwt" ]] || {
  echo "Falha: função com autenticação em código recebeu argumentos inesperados: ${calls[1]}" >&2
  exit 1
}

echo "OK: argumentos de deploy preservam o contrato JWT da CLI atual."
