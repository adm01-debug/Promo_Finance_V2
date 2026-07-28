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

FUNCS_DIR="supabase/functions"
cd "$(dirname "$0")/../.." || exit 1

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
# 2) Type-check de todas as funções
# ---------------------------------------------------------------------------
# Exclusões: funções que dependem de pacotes npm nativos (node-forge) que o
# `deno check` não consegue resolver sem `node_modules` instalado. Elas seguem
# cobertas em runtime pelo bundler do Supabase.
EXCLUIR_REGEX='nfe-upload-certificado|sefaz-manifestar'

mapfile -t alvos < <(
  find "$FUNCS_DIR" -mindepth 2 -maxdepth 2 -name 'index.ts' \
    | grep -vE "$EXCLUIR_REGEX" \
    | sort
)

if [ "${#alvos[@]}" -eq 0 ]; then
  echo "::error::Nenhuma edge function encontrada para type-check."
  exit 1
fi

echo "▶ Type-check de ${#alvos[@]} edge functions…"
if ! deno check --no-lock "${alvos[@]}"; then
  echo "::error::deno check falhou — corrija os erros de tipagem acima."
  falhas=1
else
  echo "  ✓ ${#alvos[@]} funções sem erros de tipagem"
fi

# ---------------------------------------------------------------------------
# 3) Módulos compartilhados
# ---------------------------------------------------------------------------
mapfile -t compartilhados < <(find "$FUNCS_DIR/_shared" -name '*.ts' ! -name '*.test.ts' | sort)
if [ "${#compartilhados[@]}" -gt 0 ]; then
  echo "▶ Type-check de ${#compartilhados[@]} módulos compartilhados…"
  if ! deno check --no-lock "${compartilhados[@]}"; then
    echo "::error::deno check falhou em _shared."
    falhas=1
  else
    echo "  ✓ _shared sem erros de tipagem"
  fi
fi

if [ "$falhas" -ne 0 ]; then
  echo ""
  echo "❌ Gate #24 reprovado."
  exit 1
fi

echo ""
echo "✅ Gate #24 aprovado."
