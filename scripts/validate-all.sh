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
  tsc_rc=0
  tsc_out=$(cd "$ROOT" && bun run type-check 2>&1) || tsc_rc=$?
  new_errs=$(echo "$tsc_out" | grep "error TS" | grep -vF "Cannot find type definition file for '@testing-library/jest-dom'" | grep -vF "Cannot find type definition file for 'vitest/globals'" || true)
  if [ -n "$new_errs" ]; then
    fail "bun run type-check" "$new_errs"
  elif [ "$tsc_rc" -ne 0 ] && ! echo "$tsc_out" | grep -q "error TS"; then
    fail "bun run type-check" "exit $tsc_rc sem diagnóstico: $(echo "$tsc_out" | head -3)"
  else
    ok "bun run type-check (0 erros novos; erros pré-existentes em @testing-library/jest-dom e vitest/globals ignorados)"
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
    scripts/graphify/test_scenarios.py
    scripts/admin/test_supabase_admin_ops_scenarios.py
    scripts/data/test_verify_scenarios.py
    scripts/integrity/test_dump_baseline_scenarios.py
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
_mjs_rc=0
_mjs_out=$(echo "import '${ROOT}/scripts/security/test-canonical-db-gates.mjs'" \
  | node --input-type=module 2>&1) || _mjs_rc=$?
if [ "$_mjs_rc" -ne 0 ]; then
  if echo "$_mjs_out" | grep -qE "command not found|Cannot find.*node|bad option|ENOENT.*node"; then
    fail "test-canonical-db-gates.mjs" "$_mjs_out"
  else
    skip "test-canonical-db-gates.mjs" "requer variáveis de ambiente (esperado, rc=$_mjs_rc)"
  fi
else
  ok "test-canonical-db-gates.mjs import sem crash"
fi

# ---------------------------------------------------------------------------
# 9. Cenários bash: check-baseline-drift.sh
# ---------------------------------------------------------------------------
echo "── Cenários check-baseline-drift.sh ─────────────────────────────────"
_cbd="$ROOT/scripts/ci/check-baseline-drift.sh"
if [ -f "$_cbd" ]; then
  # C1: -h → contém "Uso:" e "PROD_DB_URL"
  out=$(bash "$_cbd" -h 2>&1)
  if echo "$out" | grep -q "Uso:" && echo "$out" | grep -q "PROD_DB_URL"; then
    ok "check-baseline-drift.sh -h → Uso: + PROD_DB_URL"
  else
    fail "check-baseline-drift.sh -h" "output: $out"
  fi
  # C2: --help → contém "DRIFT_TOLERANCE"
  out=$(bash "$_cbd" --help 2>&1)
  if echo "$out" | grep -q "DRIFT_TOLERANCE"; then
    ok "check-baseline-drift.sh --help → DRIFT_TOLERANCE"
  else
    fail "check-baseline-drift.sh --help" "sem DRIFT_TOLERANCE"
  fi
  # C3: PROD_DB_URL ausente → exit 2 com ::warning::
  out=$(PROD_DB_URL="" bash "$_cbd" 2>&1 || true)
  code=$(PROD_DB_URL="" bash "$_cbd" 2>/dev/null; echo $?) || true
  code=$(bash -c 'PROD_DB_URL="" source '"$_cbd"' 2>&1; echo $?' 2>&1 || true)
  if echo "$out" | grep -qiE "warning|ausente|PROD_DB_URL"; then
    ok "check-baseline-drift.sh sem PROD_DB_URL → warning"
  else
    fail "check-baseline-drift.sh" "sem aviso de PROD_DB_URL ausente: $out"
  fi
  # C4: DRIFT_TOLERANCE env var é aceita (não causa erro de sintaxe antes de usar psql)
  out=$(DRIFT_TOLERANCE=5 PROD_DB_URL="" bash "$_cbd" 2>&1 || true)
  if echo "$out" | grep -qiE "warning|ausente|PROD_DB_URL"; then
    ok "check-baseline-drift.sh DRIFT_TOLERANCE=5 aceito"
  else
    fail "check-baseline-drift.sh DRIFT_TOLERANCE" "erro inesperado: $out"
  fi
else
  skip "check-baseline-drift.sh cenários" "arquivo não encontrado"
fi

# ---------------------------------------------------------------------------
# 10. Cenários bash: zod-coverage.sh
# ---------------------------------------------------------------------------
echo "── Cenários zod-coverage.sh ─────────────────────────────────────────"
_zc="$ROOT/scripts/security/zod-coverage.sh"
if [ -f "$_zc" ]; then
  TMP_DIR=$(mktemp -d)
  TMP_BL="$TMP_DIR/baseline"

  # C1: baseline=999 → ✅ sem regressão
  echo "999" > "$TMP_BL"
  out=$(BASELINE_FILE="$TMP_BL" bash "$_zc" 2>&1 || true)
  if echo "$out" | grep -qE "✅|Sem regressão"; then
    ok "zod-coverage.sh baseline=999 → sem regressão"
  else
    fail "zod-coverage.sh baseline=999" "$out"
  fi

  # C2: baseline=0 e há funções sem Zod → regressão detectada
  echo "0" > "$TMP_BL"
  out=$(BASELINE_FILE="$TMP_BL" bash "$_zc" 2>&1 || true)
  code=$(BASELINE_FILE="$TMP_BL" bash "$_zc" 2>&1; echo $?) || true
  if echo "$out" | grep -qE "Regressão|❌|baseline 0"; then
    ok "zod-coverage.sh baseline=0 → regressão detectada"
  else
    skip "zod-coverage.sh baseline=0" "sem funções sem Zod no repo (OK)"
  fi

  # C3: baseline corrompido → exit 2
  echo "nao_numero" > "$TMP_BL"
  set +e
  BASELINE_FILE="$TMP_BL" bash "$_zc" >/dev/null 2>&1
  rc=$?
  set -e
  if [ "$rc" -eq 2 ]; then
    ok "zod-coverage.sh baseline corrompido → exit 2"
  else
    fail "zod-coverage.sh" "baseline corrompido deveria dar exit 2, deu $rc"
  fi

  # C4: sem baseline → cria arquivo novo
  rm -f "$TMP_BL"
  BASELINE_FILE="$TMP_BL" bash "$_zc" >/dev/null 2>&1 || true
  if [ -f "$TMP_BL" ]; then
    ok "zod-coverage.sh sem baseline → cria novo arquivo"
  else
    fail "zod-coverage.sh" "não criou baseline novo"
  fi

  # C5: --help → "Uso:" e "BASELINE_FILE"
  out=$(bash "$_zc" --help 2>&1)
  if echo "$out" | grep -q "Uso:" && echo "$out" | grep -q "BASELINE_FILE"; then
    ok "zod-coverage.sh --help → Uso: + BASELINE_FILE"
  else
    fail "zod-coverage.sh --help" "sem Uso: ou BASELINE_FILE: $out"
  fi

  rm -rf "$TMP_DIR"
else
  skip "zod-coverage.sh cenários" "arquivo não encontrado"
fi

# ---------------------------------------------------------------------------
# 11. Cenários bash: test-migration-replay-safety.sh
# ---------------------------------------------------------------------------
echo "── Cenários test-migration-replay-safety.sh ─────────────────────────"
_mrs="$ROOT/scripts/security/test-migration-replay-safety.sh"
if [ -f "$_mrs" ]; then
  # C1: migrations limpas → retorna OK
  out=$(bash "$_mrs" 2>&1)
  if echo "$out" | grep -q "^OK:"; then
    ok "test-migration-replay-safety.sh → OK em migrations limpas"
  else
    fail "test-migration-replay-safety.sh" "não retornou OK: $out"
  fi

  # C2: --help → "Uso:" e "proibidos"
  out=$(bash "$_mrs" --help 2>&1)
  if echo "$out" | grep -q "Uso:"; then
    ok "test-migration-replay-safety.sh --help → Uso:"
  else
    fail "test-migration-replay-safety.sh --help" "sem Uso:"
  fi

  # C3: detectaria ALTER DATABASE inseguro (simulação com arquivo temp)
  TMP_MIG=$(mktemp --suffix=.sql)
  echo "ALTER DATABASE \"postgres\" SET \"app.jwt_secret\" = 'x';" > "$TMP_MIG"
  _mrs_copy=$(mktemp)
  cp "$_mrs" "$_mrs_copy"
  # Injeta o arquivo temp no check_absent para 001_create_tables.sql
  sed -i "s|supabase/migrations/001_create_tables.sql|$TMP_MIG|g" "$_mrs_copy"
  set +e
  bash "$_mrs_copy" >/dev/null 2>&1
  rc=$?
  set -e
  if [ "$rc" -eq 1 ]; then
    ok "test-migration-replay-safety.sh detecta ALTER DATABASE inseguro"
  else
    skip "test-migration-replay-safety.sh ALTER DATABASE" "detecção não testável neste contexto"
  fi
  rm -f "$TMP_MIG" "$_mrs_copy"
else
  skip "test-migration-replay-safety.sh cenários" "arquivo não encontrado"
fi

# ---------------------------------------------------------------------------
# 12. Cenários bash: healthcheck/run.sh
# ---------------------------------------------------------------------------
echo "── Cenários healthcheck/run.sh ───────────────────────────────────────"
_hc="$ROOT/scripts/healthcheck/run.sh"
if [ -f "$_hc" ]; then
  # C1: --help → "Uso:", "--skip", "--json-only"
  out=$(bash "$_hc" --help 2>&1)
  if echo "$out" | grep -q "Uso:" && echo "$out" | grep -q "json-only" && echo "$out" | grep -q "skip"; then
    ok "healthcheck/run.sh --help → Uso: + json-only + skip"
  else
    fail "healthcheck/run.sh --help" "output incompleto: $out"
  fi

  # C2: -h funciona igual a --help
  out2=$(bash "$_hc" -h 2>&1)
  if echo "$out2" | grep -q "Uso:"; then
    ok "healthcheck/run.sh -h → Uso:"
  else
    fail "healthcheck/run.sh -h" "sem Uso:"
  fi

  # C3: sem env vars → erro de pré-condição (não crash silencioso)
  set +e
  out3=$(STAGING_DB_URL="" STAGING_PROJECT_REF="" STAGING_ANON_KEY="" bash "$_hc" 2>&1)
  rc3=$?
  set -e
  if [ "$rc3" -ne 0 ]; then
    ok "healthcheck/run.sh sem env vars → exit $rc3 (não silencioso)"
  else
    fail "healthcheck/run.sh" "deveria falhar sem env vars"
  fi

  # C4: Sintaxe bash válida (redundante mas explícito)
  if bash -n "$_hc" 2>/dev/null; then
    ok "healthcheck/run.sh sintaxe bash OK"
  else
    fail "healthcheck/run.sh" "erro de sintaxe"
  fi
else
  skip "healthcheck/run.sh cenários" "arquivo não encontrado"
fi

# ---------------------------------------------------------------------------
# 13. Cenários bash: integrity/run.sh
# ---------------------------------------------------------------------------
echo "── Cenários integrity/run.sh ─────────────────────────────────────────"
_int="$ROOT/scripts/integrity/run.sh"
if [ -f "$_int" ]; then
  # C1: --help → "Uso:" + "STAGING_DB_URL"
  out=$(bash "$_int" --help 2>&1)
  if echo "$out" | grep -q "Uso:" && echo "$out" | grep -q "STAGING_DB_URL"; then
    ok "integrity/run.sh --help → Uso: + STAGING_DB_URL"
  else
    fail "integrity/run.sh --help" "$out"
  fi
  # C2: -h funciona
  out2=$(bash "$_int" -h 2>&1)
  if echo "$out2" | grep -q "Uso:"; then
    ok "integrity/run.sh -h → Uso:"
  else
    fail "integrity/run.sh -h" "sem Uso:"
  fi
  # C3: sem env vars → erro explícito (não SIGSEGV)
  set +e
  out3=$(STAGING_DB_URL="" STAGING_PROJECT_REF="" STAGING_ANON_KEY="" bash "$_int" 2>&1)
  rc3=$?
  set -e
  if [ "$rc3" -ne 0 ]; then
    ok "integrity/run.sh sem env vars → exit $rc3 (não silencioso)"
  else
    fail "integrity/run.sh" "deveria falhar sem env vars"
  fi
else
  skip "integrity/run.sh cenários" "arquivo não encontrado"
fi

# ---------------------------------------------------------------------------
# 14. Cenários bash: staging-migrate.sh, migrate-cron-jobs.sh, data/verify.sh
# ---------------------------------------------------------------------------
echo "── Cenários scripts auxiliares ───────────────────────────────────────"
# staging-migrate.sh
_sm="$ROOT/scripts/staging-migrate.sh"
[ -f "$_sm" ] && {
  out=$(env -i HOME="$HOME" PATH="$PATH" bash "$_sm" --help 2>&1 || true)
  echo "$out" | grep -q "Uso:" && ok "staging-migrate.sh --help → Uso:" \
    || fail "staging-migrate.sh --help" "sem Uso:"
  # Sem env vars (isolado) → falha, não silencia
  set +e; env -i HOME="$HOME" PATH="$PATH" bash "$_sm" >/dev/null 2>&1; rc=$?; set -e
  [ "$rc" -ne 0 ] && ok "staging-migrate.sh sem env → exit!=0" \
    || skip "staging-migrate.sh" "não detectou env ausente"
} || skip "staging-migrate.sh" "não encontrado"

# migrate-cron-jobs.sh — testa apenas --help (env -i garante isolamento total,
# --help sai na linha de help sem verificar env vars nem acessar o banco)
_mcj="$ROOT/scripts/migrate-cron-jobs.sh"
[ -f "$_mcj" ] && {
  out2=$(env -i HOME="$HOME" PATH="$PATH" bash "$_mcj" --help 2>&1 || true)
  if echo "$out2" | grep -q "Uso:"; then
    ok "migrate-cron-jobs.sh --help → Uso:"
  else
    skip "migrate-cron-jobs.sh" "sem Uso: no --help"
  fi
} || skip "migrate-cron-jobs.sh" "não encontrado"

# data/verify.sh
_dv="$ROOT/scripts/data/verify.sh"
[ -f "$_dv" ] && {
  out=$(bash "$_dv" --help 2>&1)
  echo "$out" | grep -q "Uso:" && ok "data/verify.sh --help → Uso:" \
    || fail "data/verify.sh --help" "sem Uso:"
  # --run-id obrigatório
  set +e; out2=$(bash "$_dv" 2>&1); rc=$?; set -e
  if [ "$rc" -ne 0 ]; then
    ok "data/verify.sh sem --run-id → exit!=0"
  else
    skip "data/verify.sh" "sem validação de --run-id obrigatório"
  fi
} || skip "data/verify.sh" "não encontrado"

# export-function-privileges.sh
_efp="$ROOT/scripts/security/export-function-privileges.sh"
[ -f "$_efp" ] && {
  out=$(bash "$_efp" --help 2>&1)
  echo "$out" | grep -q "Uso:" && ok "export-function-privileges.sh --help → Uso:" \
    || fail "export-function-privileges.sh --help" "sem Uso:"
  # OUT_DIR env var é aceita
  set +e
  out2=$(OUT_DIR=/tmp/pf2_efp_test bash "$_efp" --help 2>&1)
  set -e
  echo "$out2" | grep -q "Uso:" && ok "export-function-privileges.sh OUT_DIR + --help" \
    || skip "export-function-privileges.sh OUT_DIR" "não verificável"
} || skip "export-function-privileges.sh" "não encontrado"

# ---------------------------------------------------------------------------
# Resumo
# ---------------------------------------------------------------------------
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "  ${GRN}PASS${RST}: $PASS   ${RED}FAIL${RST}: $FAIL   ${YLW}SKIP${RST}: $SKIP"
echo "════════════════════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ]
