#!/usr/bin/env bash
#
# Gate #24 — Type-check de TODAS as Edge Functions + fonte única de Zod.
#
# Contexto: durante meses o CI só rodava `deno check` em 4 módulos puros, então
# 53 erros de tipagem chegaram a produção sem nenhum sinal (incluindo dois
# arquivos que nem parseavam). Este script fecha essa porta.
#
# Uso: scripts/ci/deno-check-functions.sh
set -uo pipefail

cd "$(dirname "$0")/../.." || exit 1

FUNCS_DIR="supabase/functions"

if [ ! -d "$FUNCS_DIR" ]; then
  echo "::error::Diretório $FUNCS_DIR não encontrado."
  exit 1
fi

falhas=0

# ---------------------------------------------------------------------------
# 1) Fonte única de Zod
# ---------------------------------------------------------------------------
# Duas cópias de Zod produzem grafos de tipos incompatíveis (TS2589,
# "type instantiation is excessively deep"). Todo import deve passar por
# _shared/zod.ts.
echo "▶ Verificando fonte única de Zod…"
violacoes_zod="$(grep -rn --include='*.ts' -E "zod@" "$FUNCS_DIR" \
  | grep -v "$FUNCS_DIR/_shared/zod.ts" || true)"

if [ -n "$violacoes_zod" ]; then
  echo "::error::Import direto de Zod detectado. Importe '{ z }' de _shared/zod.ts."
  echo "$violacoes_zod"
  falhas=1
else
  echo "  ✓ Todos os imports de Zod passam por _shared/zod.ts"
fi

# ---------------------------------------------------------------------------
# 2) Exceções derivadas do grafo real de imports
# ---------------------------------------------------------------------------
# Funções que dependem (direta ou transitivamente) de pacotes npm nativos
# (node-forge) não são checáveis offline. A lista é calculada, não hard-coded,
# para não envelhecer quando um módulo compartilhado passar a importá-los.
mapfile -t excecoes < <(python3 scripts/ci/listar-excecoes-npm-nativo.py)
echo "▶ ${#excecoes[@]} arquivos pulados por dependência npm nativa."

esta_excluido() {
  local alvo="$1" e
  for e in "${excecoes[@]}"; do
    [ "$e" = "$alvo" ] && return 0
  done
  return 1
}

# ---------------------------------------------------------------------------
# 3) Type-check de todas as funções + módulos compartilhados
# ---------------------------------------------------------------------------
alvos=()
while IFS= read -r arquivo; do
  esta_excluido "$arquivo" || alvos+=("$arquivo")
done < <(
  {
    find "$FUNCS_DIR" -mindepth 2 -maxdepth 2 -name 'index.ts'
    find "$FUNCS_DIR/_shared" -name '*.ts' ! -name '*.test.ts'
  } | sort -u
)

if [ "${#alvos[@]}" -eq 0 ]; then
  echo "::error::Nenhum arquivo elegível para type-check."
  exit 1
fi

echo "▶ Type-check de ${#alvos[@]} arquivos…"
if ! deno check --no-lock "${alvos[@]}"; then
  echo "::error::deno check falhou — corrija os erros de tipagem acima."
  falhas=1
else
  echo "  ✓ ${#alvos[@]} arquivos sem erros de tipagem"
fi

if [ "$falhas" -ne 0 ]; then
  echo ""
  echo "❌ Gate #24 reprovado."
  exit 1
fi

echo ""
echo "✅ Gate #24 aprovado."
