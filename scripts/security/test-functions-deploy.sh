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
# POST_DEPLOY_CHECK=0: este teste afere o CONTRATO DE ARGUMENTOS do deploy.
# A verificação pós-deploy acrescenta chamadas read-only (`functions list`) e
# faz I/O de rede — mantê-la ligada aqui tornaria o teste não determinístico.
# Que o bloco pós-deploy não escreve nada é aferido estaticamente no fim.
# REQUIRED_SECRETS/FUNCTIONS_DIR/STOP_ON_FAIL vazios: o job de deploy exporta
# REQUIRED_SECRETS (vars.REQUIRED_SECRETS) e, herdado aqui, fazia o script
# consultar `supabase secrets list` no mock e abortar com exit 5.
PATH="$TMP_DIR/bin:$PATH" \
SUPABASE_TEST_CAPTURE="$CAPTURE" \
SUPABASE_ACCESS_TOKEN="sbp_teste" \
SUPABASE_PROJECT_REF="projeto_teste" \
REQUIRED_SECRETS="" \
FUNCTIONS_DIR="" \
STOP_ON_FAIL="" \
POST_DEPLOY_CHECK=0 \
bash scripts/migrate-functions.sh \
  --only "detectar-anomalias-financeiras,compare-schemas" >/dev/null

if [[ ! -f "$CAPTURE" ]]; then
  echo "Falha: scripts/migrate-functions.sh terminou sem chamar a CLI supabase." >&2
  exit 1
fi
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

# O bloco pós-deploy só pode ler. Qualquer subcomando de escrita da CLI dentro
# dele (deploy, delete, secrets set, db push...) transformaria uma verificação
# em efeito colateral no destino — e passaria despercebido no teste acima,
# porque ele roda com POST_DEPLOY_CHECK=0.
pos_deploy="$(sed -n '/^# --- Verificação pós-deploy/,/^# --- Resumo/p' scripts/migrate-functions.sh)"
escritas="$(printf '%s\n' "$pos_deploy" \
  | grep -oE 'supabase[[:space:]]+[a-z-]+([[:space:]]+[a-z-]+)?' \
  | grep -vE 'supabase[[:space:]]+functions[[:space:]]+list' || true)"
if [[ -n "$escritas" ]]; then
  echo "Falha: verificação pós-deploy chama a CLI fora de 'functions list':" >&2
  printf '  %s\n' "$escritas" >&2
  exit 1
fi

echo "OK: argumentos de deploy preservam o contrato JWT da CLI atual."
echo "OK: verificação pós-deploy não chama subcomando de escrita da CLI." 
