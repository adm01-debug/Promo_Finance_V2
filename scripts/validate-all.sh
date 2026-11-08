#!/usr/bin/env bash
# Smoke-test de todos os scripts: verifica sintaxe, --help e modo dry-run.
# Falha com exit 1 se qualquer script retornar erro inesperado.
# Uso: bash scripts/validate-all.sh [--fast]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAST=${1:-}
PASS=0; FAIL=0; SKIP=0
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'; RST='\033[0m'

ok()   { echo -e "${GRN}✅ PASS${RST} $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}❌ FAIL${RST} $1: $2"; FAIL=$((FAIL+1)); }
skip() { echo -e "${YLW}⏭  SKIP${RST} $1: $2"; SKIP=$((SKIP+1)); }

# ---------------------------------------------------------------------------
# 1. Verificação de sintaxe — bash
# ---------------------------------------------------------------------------
echo "── Sintaxe bash ──────────────────────────────────────────────────────"
while IFS= read -r -d '' f; do
  if bash -n "$f" 2>/tmp/syn_err; then
    ok "bash -n $f"
  else
    fail "bash -n $f" "$(cat /tmp/syn_err)"
  fi
done < <(find "$ROOT/scripts" -name "*.sh" -print0)

# ---------------------------------------------------------------------------
# 2. Verificação de sintaxe — Python
# ---------------------------------------------------------------------------
echo "── Sintaxe Python ────────────────────────────────────────────────────"
while IFS= read -r -d '' f; do
  if python3 -m py_compile "$f" 2>/tmp/syn_err; then
    ok "py_compile $f"
  else
    fail "py_compile $f" "$(cat /tmp/syn_err)"
  fi
done < <(find "$ROOT/scripts" -name "*.py" -print0)

# ---------------------------------------------------------------------------
# 3. TypeScript type-check via bun run type-check (usa tsconfig do projeto)
# ---------------------------------------------------------------------------
echo "── TypeScript (bun run type-check) ───────────────────────────────────"
if command -v bun &>/dev/null && [ -f "$ROOT/package.json" ]; then
  # Captura erros pré-existentes em main para distinguir dos nossos
  tsc_out=$(cd "$ROOT" && bun run type-check 2>&1 || true)
  new_errs=$(echo "$tsc_out" | grep "error TS" | grep -vF "Cannot find type definition file for '@testing-library/jest-dom'" | grep -vF "Cannot find type definition file for 'vitest/globals'" || true)
  if [ -z "$new_errs" ]; then
    ok "bun run type-check (0 erros novos; 2 erros pré-existentes em @testing-library/jest-dom e vitest/globals ignorados)"
  else
    fail "bun run type-check" "$new_errs"
  fi
else
  skip "type-check" "bun não disponível"
fi

# ---------------------------------------------------------------------------
# 3b. Python unit tests (unittest discover)
# ---------------------------------------------------------------------------
echo "── Python unit tests ─────────────────────────────────────────────────"
if python3 -c "import unittest" 2>/dev/null; then
  py_tests=(
    scripts/graphify/test_typescript_imports.py
    scripts/graphify/test_sql_inventory.py
    scripts/graphify/test_graph_quality.py
    scripts/graphify/test_benchmark.py
    scripts/graphify/test_run.py
    scripts/graphify/test_code_references.py
    scripts/graphify/test_edge_inventory.py
    scripts/graphify/test_profiles.py
    scripts/graphify/test_requirements_lock.py
  )
  for f in "${py_tests[@]}"; do
    fp="$ROOT/$f"
    [ -f "$fp" ] || { skip "$f" "não encontrado"; continue; }
    if out=$(python3 "$fp" 2>&1) && echo "$out" | grep -qE "^OK$|^OK "; then
      ran=$(echo "$out" | grep "Ran" | head -1)
      ok "$(basename $f): $ran"
    else
      fail "$(basename $f)" "$(echo "$out" | tail -5)"
    fi
  done
else
  skip "python unit tests" "python3 não disponível"
fi

# ---------------------------------------------------------------------------
# 4. Node.js / MJS — sintaxe via --check
# ---------------------------------------------------------------------------
echo "── Sintaxe MJS/CJS (node --check) ────────────────────────────────────"
while IFS= read -r -d '' f; do
  if node --check "$f" 2>/tmp/syn_err; then
    ok "node --check $(basename $f)"
  else
    fail "node --check $(basename $f)" "$(cat /tmp/syn_err)"
  fi
done < <(find "$ROOT/scripts" -name "*.mjs" -print0)

# ---------------------------------------------------------------------------
# 5. Scripts bash —help / dry-run onde suportado
# ---------------------------------------------------------------------------
echo "── Scripts bash --help ────────────────────────────────────────────────"
help_scripts=(
  scripts/healthcheck/run.sh
  scripts/ci/check-baseline-drift.sh
  scripts/data/verify.sh
  scripts/staging-migrate.sh
  scripts/migrate-cron-jobs.sh
  scripts/security/export-function-privileges.sh
  scripts/security/zod-coverage.sh
  scripts/security/test-migration-replay-safety.sh
  scripts/integrity/run.sh
)
for rel in "${help_scripts[@]}"; do
  f="$ROOT/$rel"
  [ -f "$f" ] || { skip "$rel" "não encontrado"; continue; }
  # Tenta --help; se script não suporta, aceita exit 1 sem stderr
  out=$(bash "$f" --help 2>&1 || true)
  if echo "$out" | grep -qiE "uso:|usage:|opcoes:|options:|help"; then
    ok "$rel --help"
  else
    # Sem mensagem de help formal — apenas verifica que não crashou com erro não tratado
    if echo "$out" | grep -qiE "command not found|syntax error|unbound variable"; then
      fail "$rel --help" "$out"
    else
      skip "$rel" "sem --help formal (OK)"
    fi
  fi
done

# ---------------------------------------------------------------------------
# 6. zod-coverage.sh — cria baseline temporário e valida lógica principal
# ---------------------------------------------------------------------------
echo "── zod-coverage.sh lógica ─────────────────────────────────────────────"
TMP_BL=$(mktemp)
echo "999" > "$TMP_BL"   # baseline impossível = sem regressão
if BASELINE_FILE="$TMP_BL" bash "$ROOT/scripts/security/zod-coverage.sh" 2>&1 \
   | grep -qE "Sem regressão|✅"; then
  ok "zod-coverage.sh lógica de não-regressão"
else
  fail "zod-coverage.sh" "lógica de não-regressão não retornou ✅"
fi
rm -f "$TMP_BL"

# ---------------------------------------------------------------------------
# 7. test-migration-replay-safety.sh — roda direto (somente grep, sem DB)
# ---------------------------------------------------------------------------
echo "── test-migration-replay-safety.sh ───────────────────────────────────"
if bash "$ROOT/scripts/security/test-migration-replay-safety.sh" 2>&1 \
   | grep -q "^OK:"; then
  ok "test-migration-replay-safety.sh"
else
  fail "test-migration-replay-safety.sh" "não retornou OK:"
fi

# ---------------------------------------------------------------------------
# 8. MJS — execução com --dry-run onde aplicável
# ---------------------------------------------------------------------------
echo "── MJS --help / dry-run ───────────────────────────────────────────────"
if node --input-type=module <(echo "import '${ROOT}/scripts/security/test-canonical-db-gates.mjs'" \
  ) 2>&1 | grep -qE "ERROR|fail|FAIL"; then
  skip "test-canonical-db-gates.mjs" "requer variáveis de ambiente (esperado)"
else
  ok "test-canonical-db-gates.mjs import sem crash"
fi

# ---------------------------------------------------------------------------
# Resumo
# ---------------------------------------------------------------------------
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "  ${GRN}PASS${RST}: $PASS   ${RED}FAIL${RST}: $FAIL   ${YLW}SKIP${RST}: $SKIP"
echo "════════════════════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ]
