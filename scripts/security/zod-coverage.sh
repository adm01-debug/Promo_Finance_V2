#!/usr/bin/env bash
# Zod coverage gate for Supabase Edge Functions.
# Emite a lista de funções que consomem `req.json()` sem passar por
# `validatePayload` (Zod contract). Falha quando a cobertura regride abaixo
# do baseline registrado em scripts/security/zod-coverage.baseline.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FUNCS_DIR="$ROOT/supabase/functions"
BASELINE_FILE="$ROOT/scripts/security/zod-coverage.baseline"

missing=()
total=0
for d in "$FUNCS_DIR"/*/; do
  name=$(basename "$d")
  [ "$name" = "_shared" ] && continue
  f="$d/index.ts"
  [ -f "$f" ] || continue
  total=$((total+1))
  if grep -q "req\.json()" "$f" 2>/dev/null; then
    if ! grep -qE "validatePayload|validateContract|\.safeParse\(|_shared/validation|_shared/contract-validator" "$f" 2>/dev/null; then
      missing+=("$name")
    fi
  fi
done

count=${#missing[@]}
echo "[zod-coverage] Total edge functions: $total"
echo "[zod-coverage] Sem validação Zod: $count"
for n in "${missing[@]}"; do echo "  - $n"; done

if [ -f "$BASELINE_FILE" ]; then
  baseline=$(cat "$BASELINE_FILE" | tr -d '[:space:]')
  if [ "$count" -gt "$baseline" ]; then
    echo "❌ Regressão: cobertura Zod piorou ($count > baseline $baseline)"
    exit 1
  fi
  echo "✅ Sem regressão (baseline $baseline)"
else
  echo "$count" > "$BASELINE_FILE"
  echo "ℹ️  Baseline criado: $count"
fi
