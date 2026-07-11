#!/usr/bin/env bash
# ============================================================================
# Guard: EXTERNAL_SUPABASE_SERVICE_ROLE_KEY é uma chave `service_role` de outro
# projeto Supabase (CRM externo). Seu blast radius em caso de vazamento é alto,
# então proibimos o uso fora da Edge Function `external-data`.
#
# Rodado no CI (ver .github/workflows/ci.yml passo "External secret isolation")
# e no pre-commit via lint-staged.
# ============================================================================
set -euo pipefail

FORBIDDEN="EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"
ALLOWED_DIR="supabase/functions/external-data"

# grep -r ignora binários por padrão; --include limita a source files.
# `|| true` para não falhar quando ripgrep está ausente.
# Só olhamos código-fonte executável (ignora docs, scripts do próprio guard e
# arquivos de auditoria onde a menção é intencional).
matches=$(grep -rln "$FORBIDDEN" \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
  --exclude-dir=coverage --exclude-dir=playwright-report \
  --exclude-dir=test-results \
  supabase/ src/ 2>/dev/null || true)

if [ -z "$matches" ]; then
  echo "✅ Nenhuma referência a $FORBIDDEN encontrada — isolamento OK."
  exit 0
fi

# Filtra referências fora do diretório permitido.
violations=$(echo "$matches" | grep -v "^$ALLOWED_DIR/" || true)
allowed_hits=$(echo "$matches" | grep "^$ALLOWED_DIR/" || true)

if [ -n "$allowed_hits" ]; then
  echo "ℹ️  Referências permitidas (dentro de $ALLOWED_DIR):"
  echo "$allowed_hits" | sed 's/^/    /'
fi

if [ -n "$violations" ]; then
  echo "::error::$FORBIDDEN foi encontrado fora de $ALLOWED_DIR:"
  echo "$violations" | sed 's/^/    /'
  echo ""
  echo "Esta chave é service_role de outro projeto Supabase e deve ficar"
  echo "confinada à Edge Function 'external-data'. Se você precisa dela em"
  echo "outro lugar, reveja o design com um responsável por segurança."
  exit 1
fi

echo "✅ $FORBIDDEN restrita a $ALLOWED_DIR."
