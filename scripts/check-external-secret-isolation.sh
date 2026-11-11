#!/usr/bin/env bash
# ============================================================================
# Guard: EXTERNAL_SUPABASE_SERVICE_ROLE_KEY é uma chave `service_role` de outro
# projeto Supabase (CRM externo). Seu blast radius em caso de vazamento é alto,
# então proibimos o uso fora da Edge Function `external-data`.
#
# Rodado no CI (ver .github/workflows/ci.yml passo "External secret isolation")
# e no pre-commit via lint-staged.
#
# Exit: 0 isolado · 1 referência fora de `external-data` · 2 guard não pôde
# ser avaliado (pasta ausente, erro de leitura).
# Testes: python3 scripts/test_check_external_secret_isolation.py
# ============================================================================
set -euo pipefail

# Raiz do repo a partir do próprio script: rodado de outro diretório, o grep não
# achava `supabase/` nem `src/` e o guard aprovava sem ter olhado nada.
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

FORBIDDEN="EXTERNAL_SUPABASE_SERVICE_KEY/EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"
# O secret que `external-data` lê de fato chama-se EXTERNAL_SUPABASE_SERVICE_KEY
# (ver .env.example e env.manifest.json). O prefixo comum cobre os dois nomes;
# procurar só o nome com `_ROLE_` deixava o secret real sem guarda nenhuma.
FORBIDDEN_PATTERN="EXTERNAL_SUPABASE_SERVICE"
ALLOWED_DIR="supabase/functions/external-data"

for dir in supabase src; do
  if [ ! -d "$dir" ]; then
    echo "::error::Pasta '$dir' ausente em $(pwd) — guard de $FORBIDDEN não pode ser avaliado." >&2
    exit 2
  fi
done

# Arquivos de configuração da raiz (vite.config.ts etc.) entram no bundle do
# frontend: uma referência ali vaza a chave para o navegador.
root_files=()
for f in *.ts *.tsx *.js *.jsx *.mjs *.cjs *.mts *.cts; do
  if [ -f "$f" ]; then root_files+=("$f"); fi
done

# grep -r ignora binários por padrão; --include limita a source files.
# Só olhamos código-fonte executável (ignora docs, scripts do próprio guard e
# arquivos de auditoria onde a menção é intencional).
# Exit 1 do grep = nenhuma ocorrência; >1 = erro de leitura, que não pode virar
# "isolamento OK".
grep_rc=0
matches=$(grep -rl -e "$FORBIDDEN_PATTERN" \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  --include='*.mjs' --include='*.cjs' --include='*.mts' --include='*.cts' \
  --include='*.sql' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
  --exclude-dir=coverage --exclude-dir=playwright-report \
  --exclude-dir=test-results \
  supabase/ src/ ${root_files[@]+"${root_files[@]}"}) || grep_rc=$?
if [ "$grep_rc" -gt 1 ]; then
  echo "::error::Falha ao varrer o código (grep saiu com $grep_rc) — guard de $FORBIDDEN não pode ser avaliado." >&2
  exit 2
fi

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
