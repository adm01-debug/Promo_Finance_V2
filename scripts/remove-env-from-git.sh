#!/bin/bash
set -e

echo "⚠️  REMOVENDO .env DO HISTÓRICO GIT"
echo ""

# Backup
if [ -f .env ]; then
  cp .env .env.backup
  echo "✓ Backup criado: .env.backup"
fi

# Remover do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

echo "✓ .env removido do histórico"
echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo "1. git push origin --force --all"
echo "2. Rotacionar TODAS credenciais"
echo "3. Atualizar .env.example"
