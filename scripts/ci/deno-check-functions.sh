#!/usr/bin/env bash
#
# Type-check do escopo endurecido.
#
# Todo o `_shared/` é coberto por glob — um arquivo compartilhado novo entra
# no gate automaticamente (a lista cravada anterior deixou de fora
# cors/observability/resilience/console-persist quando eles nasceram). As
# funções endurecidas seguem em lista explícita porque o repo ainda tem
# dívida histórica de Deno fora delas: este gate não afirma "todas as Edge
# Functions tipam", ele prova os módulos críticos, sem falso positivo.
#
# Uso: scripts/ci/deno-check-functions.sh
set -euo pipefail

cd "$(dirname "$0")/../.." || exit 1

# Sem isto o script validava a lista inteira e só então morria com
# "deno: command not found" (127), sem dizer o que fazer.
if ! command -v deno >/dev/null 2>&1; then
  echo "::error::deno não encontrado no PATH — instale o Deno (no CI: denoland/setup-deno) antes de rodar este gate."
  exit 127
fi
# `find` falhando dentro de `< <(...)` não derruba o script: sem o diretório, o
# gate passaria só com a lista fixa, sem nenhum arquivo de _shared.
if [ ! -d supabase/functions/_shared ]; then
  echo "::error::supabase/functions/_shared não encontrado — o gate Deno não tem o que provar."
  exit 1
fi

alvos=()
while IFS= read -r arquivo; do
  alvos+=("$arquivo")
done < <(find supabase/functions/_shared -name '*.ts' | sort)
while IFS= read -r arquivo; do
  alvos+=("$arquivo")
done <<'EOF'
supabase/functions/api-keys-manage/index.ts
supabase/functions/convidar-usuario/index.ts
supabase/functions/mcp-query/index.ts
supabase/functions/analise-fluxo-ia/index.ts
supabase/functions/analyze-document/index.ts
supabase/functions/benchmarking-setorial/index.ts
supabase/functions/categorizar-despesa/index.ts
supabase/functions/conciliacao-proxy/index.ts
supabase/functions/nfe-vinculo-proxy/index.ts
supabase/functions/insights-relatorio/index.ts
supabase/functions/enviar-alerta-email/index.ts
supabase/functions/executar-analise-preditiva/index.ts
supabase/functions/gerar-alertas-tributarios/index.ts
supabase/functions/whatsapp-ia-proativo/index.ts
supabase/functions/sync-catalogo-ncm-nbs/index.ts
supabase/functions/sync-aliquota-referencia/index.ts
EOF

for arquivo in "${alvos[@]}"; do
  if [ ! -f "$arquivo" ]; then
    echo "::error::Arquivo crítico ausente no gate Deno: $arquivo"
    exit 1
  fi
done

echo "▶ Type-check de ${#alvos[@]} arquivos críticos alterados nesta trilha…"
# --no-config evita carregar o deno.json da raiz (que tem nodeModulesDir=auto),
# mantendo o gate isolado das dependências do frontend React.
# O import map das Edge Functions é passado explicitamente via --import-map.
IMPORT_MAP=""
[ -f "supabase/functions/import_map.json" ] && IMPORT_MAP="--import-map=supabase/functions/import_map.json"

# shellcheck disable=SC2086
deno check --no-config --no-lock $IMPORT_MAP "${alvos[@]}"

echo
echo "✅ Gate Deno do escopo endurecido aprovado."
