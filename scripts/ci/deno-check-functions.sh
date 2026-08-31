#!/usr/bin/env bash
#
# Type-check do escopo endurecido nesta trilha.
#
# Contexto: este lote mexe em guards de autenticação e no `mcp-query`. O
# repositório ainda tem dívida histórica de Deno fora desse escopo, então este
# gate não afirma "todas as Edge Functions tipam"; ele prova apenas os módulos
# críticos alterados aqui, sem gerar falso positivo ou falso negativo.
#
# Uso: scripts/ci/deno-check-functions.sh
set -euo pipefail

cd "$(dirname "$0")/../.." || exit 1

alvos=()
while IFS= read -r arquivo; do
  alvos+=("$arquivo")
done <<'EOF'
supabase/functions/_shared/auth-guard.ts
supabase/functions/_shared/sql-write-guard.ts
supabase/functions/_shared/webhook-auth.ts
supabase/functions/mcp-query/index.ts
supabase/functions/analise-fluxo-ia/index.ts
supabase/functions/analyze-document/index.ts
supabase/functions/benchmarking-setorial/index.ts
supabase/functions/categorizar-despesa/index.ts
supabase/functions/insights-relatorio/index.ts
supabase/functions/enviar-alerta-email/index.ts
supabase/functions/executar-analise-preditiva/index.ts
supabase/functions/gerar-alertas-tributarios/index.ts
supabase/functions/whatsapp-ia-proativo/index.ts
EOF

for arquivo in "${alvos[@]}"; do
  if [ ! -f "$arquivo" ]; then
    echo "::error::Arquivo crítico ausente no gate Deno: $arquivo"
    exit 1
  fi
done

echo "▶ Type-check de ${#alvos[@]} arquivos críticos alterados nesta trilha…"
deno check --no-lock "${alvos[@]}"

echo
echo "✅ Gate Deno do escopo endurecido aprovado."
