#!/usr/bin/env bash
# shellcheck disable=SC2317  # funções job_* são chamadas por nome dinâmico
# scripts/ci-local.sh — Promo_Finance_V2
# Gerado em 2026-11-07 a partir de .github/workflows/{ci.yml, deno-tests.yml, supabase-linter.yml}
# Checks obrigatórios na main em 07/11/2026: Supabase DB Linter, Quality Gate & Tests, E2E Critical Gate, Integration tests (edge functions live), E2E Financeiro (offline), E2E Destructive Logout, Varredura de segredos (gitleaks), Unit tests (offline, deterministic)
# LEMBRETE: ao mudar um workflow obrigatório, atualize este script (steps literais abaixo).
#
# Reproduz localmente (WSL) os jobs que rodam em pull_request: cada step roda o `run:` literal do
# workflow com o env do job+step, o shell do CI (defaults.run.shell) e o timeout do job; actions sem
# equivalente local viram SKIP com motivo e deixam o job INCONCLUSIVO. GITHUB_* são emuladas como um PR
# contra origin/main (CI_BASE_SHA = merge-base; --base/--all-changed para outros casos). Nada é instalado
# globalmente (npm ci/bun install/playwright install usam os caches de usuário; --with-deps é removido).
# Hash dos workflows na geração: c4c8d1fae7893da1 (o script avisa em runtime se eles mudarem).
# 3 dos 8 obrigatórios (E2E Critical, E2E Destructive, Integration live) exigem Supabase real + usuários E2E:
# ficam como cloud-only (não verificado) a menos que rodem com --only e os segredos no ambiente.
# Quality Gate é parcial: gates psql/pgTAP (DATABASE_URL) e test-rpc-runtime (SUPABASE_URL/ANON/E2E_USER) pulam sem segredo.
# Supabase DB Linter só roda os steps quando o branch toca supabase/migrations|functions|scripts/security|config.toml.

set -euo pipefail

CI_REPO='Promo_Finance_V2'
CI_GERADO_EM='07/11/2026'
CI_WF_HASH='c4c8d1fae7893da1'
CI_WF_FILES='.github/workflows/ci.yml .github/workflows/deno-tests.yml .github/workflows/supabase-linter.yml .github/actions/setup-bun/action.yml .github/actions/setup-playwright/action.yml'
CI_WORKFLOWS='ci.yml, deno-tests.yml, supabase-linter.yml'
CI_REQUIRED_CHECKS='Supabase DB Linter, Quality Gate & Tests, E2E Critical Gate, Integration tests (edge functions live), E2E Financeiro (offline), E2E Destructive Logout, Varredura de segredos (gitleaks), Unit tests (offline, deterministic)'
CI_LIST_NOTAS=''

# ───────────────────────── runtime comum (idêntico nos 9 repos) ─────────────────────────
usage() {
  cat <<'EOF'
Uso: scripts/ci-local.sh [--list] [--fast] [--only <job>[,<job>]] [--skip <job>] [--no-docker] [--keep-going]
                         [--strict] [--verbose] [--base <ref>] [--all-changed]

  --list         lista os jobs: id, se é obrigatório na main ([REQ]), classe e o que cada um pula
  (sem flags)    roda todos os jobs obrigatórios reproduzíveis, na ordem dos needs, parando no 1º erro
  --fast         pula jobs/steps opcional-pesado (E2E/browsers/lighthouse/mutação) e os que precisam de docker
  --only a,b     roda só esses jobs (coluna "job" do --list) + os jobs provedores de outputs de que dependem
  --skip a,b     pula esses jobs
  --no-docker    pula só os steps que sobem Postgres/containers
  --keep-going   não para no primeiro erro; resume tudo no fim
  --strict       exit 3 quando algum check obrigatório ficou INCONCLUSIVO (pulado por segredo/docker/--fast/cloud)
  --verbose      mostra o stdout de todos os steps (padrão: só dos que falham) e cada SKIP na hora
  --base <ref>   base do "PR" emulado (padrão: merge-base de origin/main com HEAD)
  --all-changed  trata todos os arquivos como alterados (útil na própria main, onde a base == HEAD)
  --no-reuse     não reaproveita node_modules entre jobs (padrão: pula `npm ci`/`bun install` repetidos
                 quando o lockfile não mudou desde o último install feito por este script)

Detecção de mudanças (paths-filter, docs-only etc.) considera commits desde a base + working tree + arquivos novos.
Segredos: exporte-os no ambiente (ex.: `SUPABASE_ACCESS_TOKEN=... scripts/ci-local.sh`); sem eles o step
é pulado com "segredo X ausente" e o job fica INCONCLUSIVO. Saída: 0 = nenhum check obrigatório falhou
(mesmo com inconclusivos; 3 com --strict), 1 = falha, 2 = uso incorreto.
EOF
}

LIST=0 FAST=0 NO_DOCKER=0 KEEP_GOING=0 STRICT=0 VERBOSE=0 ALL_CHANGED=0 REUSE=1 ONLY="" SKIPS="" BASE_REF=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --list) LIST=1 ;;
    --fast) FAST=1 ;;
    --no-docker) NO_DOCKER=1 ;;
    --keep-going) KEEP_GOING=1 ;;
    --strict) STRICT=1 ;;
    --verbose|-v) VERBOSE=1 ;;
    --all-changed) ALL_CHANGED=1 ;;
    --no-reuse) REUSE=0 ;;
    --only) ONLY="${ONLY:+$ONLY,}${2:-}"; shift ;;
    --only=*) ONLY="${ONLY:+$ONLY,}${1#*=}" ;;
    --skip) SKIPS="${SKIPS:+$SKIPS,}${2:-}"; shift ;;
    --skip=*) SKIPS="${SKIPS:+$SKIPS,}${1#*=}" ;;
    --base) BASE_REF=${2:-}; shift ;;
    --base=*) BASE_REF=${1#*=} ;;
    -h|--help) usage; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

cd "$(dirname "${BASH_SOURCE[0]}")/../../.."
ROOT=$(pwd)
export ROOT

if [[ -t 1 ]]; then
  C_G=$'\e[32m' C_R=$'\e[31m' C_Y=$'\e[33m' C_B=$'\e[1m' C_D=$'\e[2m' C_0=$'\e[0m'
else
  C_G="" C_R="" C_Y="" C_B="" C_D="" C_0=""
fi

CI_TMP=""
CLEANUPS=()
cleanup() {
  trap '' INT TERM
  trap - EXIT
  local c
  for c in "${CLEANUPS[@]}"; do eval "$c" >/dev/null 2>&1 || true; done
  [[ -n "$CI_TMP" && -d "$CI_TMP" ]] && rm -rf "$CI_TMP"
  return 0
}
trap cleanup EXIT
trap 'echo; echo "interrompido (SIGINT)"; exit 130' INT
trap 'echo; echo "encerrado (SIGTERM)"; exit 143' TERM
# só registre um cleanup DEPOIS de o recurso existir (nunca no início do job)
add_cleanup() { CLEANUPS+=("$1"); }

# node da versão que o repo pede (nvm, se instalada); estrito => aborta em vez de "seguir com a instalada"
ci_use_node() { # major estrito(0|1) motivo
  local want=$1 strict=$2 why=$3 have
  have=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
  [[ "$have" == "$want" ]] && return 0
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    # shellcheck disable=SC1091
    source "$NVM_DIR/nvm.sh" --no-use >/dev/null 2>&1 || true
    if nvm use "$want" --silent >/dev/null 2>&1; then
      echo "${C_D}node: usando v$(node -v | tr -d v) via nvm (o repo pede node ${want}: ${why})${C_0}"
      return 0
    fi
  fi
  if (( strict )); then
    echo "${C_R}✘ node ${want} é exigido por este repo (${why}) e node $(node -v 2>/dev/null) não serve (engine-strict).${C_0}" >&2
    echo "   instale com: nvm install ${want}   (ou fnm/volta) e rode de novo." >&2
    exit 2
  fi
  echo "${C_Y}⚠ versão:${C_0} node instalado = $(node -v 2>/dev/null), o repo pede node ${want} (${why}); nvm não tem essa versão — seguindo com a instalada"
  return 0
}

# ── registro de jobs ──
declare -a JOB_ORDER=()
declare -A JOB_NAME JOB_WF JOB_REQ JOB_CLASS JOB_NEEDS JOB_STATIC_SKIPS JOB_RESULT JOB_TIME JOB_RUNTIME_SKIPS JOB_HEAVY JOB_DOCKER JOB_CLOUD JOB_AGG JOB_PROVIDER
# reg_job id nome workflow req(req|via:<agg>|ci|opt) classe needs "o que pula" heavy docker cloud agg provider
reg_job() {
  JOB_ORDER+=("$1")
  JOB_NAME[$1]=$2; JOB_WF[$1]=$3; JOB_REQ[$1]=$4; JOB_CLASS[$1]=$5; JOB_NEEDS[$1]=$6
  JOB_STATIC_SKIPS[$1]=$7; JOB_HEAVY[$1]=$8; JOB_DOCKER[$1]=$9; JOB_CLOUD[$1]=${10}; JOB_AGG[$1]=${11}; JOB_PROVIDER[$1]=${12:-0}
  JOB_RESULT[$1]=pending; JOB_TIME[$1]=0; JOB_RUNTIME_SKIPS[$1]=""
}
# resultados: success | failure | inconclusive (steps bloqueantes pulados) | assumed (cloud-only) |
#             skipped_ci (if do job falso, como no CI) | skipped_local (--fast/--no-docker/pré-condição) |
#             deselected (--only/--skip) | pending

# ── estado do job corrente ──
CUR_JOB="" CUR_LABEL="" JOB_FAILED=0 JOB_ANY_FAILED=0 JOB_INCONCL=0 QUIET_SKIPS=0 JOB_T0=0
STEP_OK=0 STEP_FAIL=0 STEP_SKIP=0
JOB_PATH_PREPEND="" JOB_PATH_PREFIX=""
declare -A STEP_OUT JOB_OUT SKIP_GROUP ENV_SAVED ENV_WAS_SET
declare -a JOB_ENV_KV=() JOB_ENV_NAMES=() SKIP_ORDER=()
ACTIONLINT_FAILED=0

job_begin() {
  CUR_JOB=$1; CUR_LABEL=$1; JOB_FAILED=0; JOB_ANY_FAILED=0; JOB_INCONCL=0; QUIET_SKIPS=0
  STEP_OK=0; STEP_FAIL=0; STEP_SKIP=0
  JOB_ENV_KV=(); JOB_ENV_NAMES=(); JOB_PATH_PREPEND=""; JOB_PATH_PREFIX=${2:-}
  SKIP_GROUP=(); SKIP_ORDER=(); ENV_SAVED=(); ENV_WAS_SET=()
  JOB_T0=$SECONDS
  echo
  echo "${C_B}━━ ${CUR_JOB} — ${JOB_NAME[$CUR_JOB]} ${C_D}(${JOB_WF[$CUR_JOB]})${C_0}"
}
job_end() {
  local n r
  if (( ! VERBOSE )); then   # em --verbose cada SKIP já saiu na hora
    for r in "${SKIP_ORDER[@]}"; do
      echo "  ${C_Y}↷ SKIP${C_0} ${CUR_JOB} — ${r}: ${SKIP_GROUP[$r]}"
    done
  fi
  if (( QUIET_SKIPS > 0 )); then
    echo "  ${C_D}↷ ${QUIET_SKIPS} step(s) de infraestrutura pulados (checkout/setup/cache/artefatos)${C_0}"
  fi
  JOB_TIME[$CUR_JOB]=$(( ${JOB_TIME[$CUR_JOB]} + SECONDS - JOB_T0 ))
  if (( JOB_FAILED || JOB_ANY_FAILED )); then JOB_RESULT[$CUR_JOB]=failure
  elif (( JOB_INCONCL )); then JOB_RESULT[$CUR_JOB]=inconclusive
  else JOB_RESULT[$CUR_JOB]=success; fi
  echo "  ${C_D}${CUR_JOB}: ${STEP_OK} ✔ · ${STEP_SKIP} ↷ · ${STEP_FAIL} ✘ (${JOB_TIME[$CUR_JOB]}s) → ${JOB_RESULT[$CUR_JOB]}${C_0}"
  for n in "${JOB_ENV_NAMES[@]}"; do
    if [[ "${ENV_WAS_SET[$n]:-0}" == 1 ]]; then export "$n=${ENV_SAVED[$n]}"; else unset "$n"; fi
  done
  return 0
}
_job_skip() { # resultado motivo
  JOB_RESULT[$CUR_JOB]=$1
  JOB_RUNTIME_SKIPS[$CUR_JOB]="job inteiro: $2"
  echo "  ${C_Y}↷ SKIP${C_0} ${CUR_JOB} — $2"
  JOB_TIME[$CUR_JOB]=$(( ${JOB_TIME[$CUR_JOB]} + SECONDS - JOB_T0 ))
}
job_skip_ci() { _job_skip skipped_ci "$1"; }        # if: do job falso — o CI também pularia
job_skip_local() { _job_skip skipped_local "$1"; }  # limitação local (--fast/--no-docker/pré-condição/porta)
job_precheck() { # cmd motivo
  if ! eval "$1" >/dev/null 2>&1; then job_skip_local "$2"; return 1; fi
  return 0
}
matrix_end() { # fim de uma combinação da matriz (fail-fast: false)
  (( JOB_FAILED )) && JOB_ANY_FAILED=1
  JOB_FAILED=0
}
job_set_output() { JOB_OUT["$1.$2"]=$3; }
job_out() { printf '%s' "${JOB_OUT[$1.$2]:-}"; }
step_out() { printf '%s' "${STEP_OUT[$1.$2]:-}"; }
job_status() { if (( JOB_FAILED || JOB_ANY_FAILED )); then echo failure; else echo success; fi; }
job_result() { # resultado como o GitHub veria (inconclusivo/cloud-only/deselecionado contam como success p/ needs)
  case "${JOB_RESULT[$1]:-pending}" in
    success|failure) printf '%s' "${JOB_RESULT[$1]}" ;;
    inconclusive|assumed|deselected) printf 'success' ;;
    *) printf 'skipped' ;;
  esac
}
docker_ok() { (( ! NO_DOCKER && ! FAST && ! ${NO_DOCKER_JOB:-0} )); }

quiet_skip() { QUIET_SKIPS=$((QUIET_SKIPS + 1)); STEP_SKIP=$((STEP_SKIP + 1)); }
# skip_step nome motivo tipo   (tipo: secret|fast|docker|cloud|precheck => job INCONCLUSIVO; if|info => não)
skip_step() {
  local name=$1 reason=$2 kind=${3:-info}
  STEP_SKIP=$((STEP_SKIP + 1))
  case "$kind" in secret|fast|docker|cloud|precheck) JOB_INCONCL=1 ;; esac
  if [[ -z "${SKIP_GROUP[$reason]:-}" ]]; then SKIP_ORDER+=("$reason"); SKIP_GROUP[$reason]=$name
  else SKIP_GROUP[$reason]+="; $name"; fi
  (( VERBOSE )) && echo "  ${C_Y}↷ SKIP${C_0} ${CUR_LABEL}/${name} — ${reason}"
  JOB_RUNTIME_SKIPS[$CUR_JOB]+="$name ($reason); "
  return 0
}

parse_github_output() { # arquivo step_id
  local f=$1 sid=$2 line k v delim l2
  [[ -s "$f" && -n "$sid" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    if [[ "$line" == *'<<'* ]]; then
      k=${line%%<<*}; delim=${line#*<<}; v=""
      while IFS= read -r l2 && [[ "$l2" != "$delim" ]]; do v+="${v:+$'\n'}$l2"; done
    else
      k=${line%%=*}; v=${line#*=}
    fi
    STEP_OUT["$sid.$k"]=$v
  done <"$f"
}
parse_github_env() { # arquivo (GITHUB_ENV: vale p/ os steps seguintes do job; valor anterior é restaurado no fim)
  local f=$1 line k v delim l2
  [[ -s "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    if [[ "$line" == *'<<'* ]]; then
      k=${line%%<<*}; delim=${line#*<<}; v=""
      while IFS= read -r l2 && [[ "$l2" != "$delim" ]]; do v+="${v:+$'\n'}$l2"; done
    else
      k=${line%%=*}; v=${line#*=}
    fi
    if [[ "$k" == PATH ]]; then echo "  ${C_Y}⚠ step tentou alterar PATH via GITHUB_ENV — ignorado (use GITHUB_PATH)${C_0}"; continue; fi
    if [[ -z "${ENV_WAS_SET[$k]+x}" ]]; then
      if [[ -n "${!k+x}" ]]; then ENV_WAS_SET[$k]=1; ENV_SAVED[$k]=${!k}; else ENV_WAS_SET[$k]=0; fi
      JOB_ENV_NAMES+=("$k")
    fi
    JOB_ENV_KV+=("$k=$v")
    export "$k=$v"
  done <"$f"
}
parse_github_path() { # arquivo (GITHUB_PATH: prepend para os steps seguintes)
  local f=$1 line
  [[ -s "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -n "$line" ]] && JOB_PATH_PREPEND="$line:$JOB_PATH_PREPEND"
  done <"$f"
}

# run_step NOME [--id ID] [--env K=V]... [--cwd DIR] [--secrets "A B"] [--if COND TEXTO] [--always]
#          [--heavy] [--docker] [--coe] [--shell "-eo pipefail"] [--timeout MIN] [--cleanup CMD] [--note TEXTO] -- CORPO
run_step() {
  local name=$1; shift
  local -a envs=() secrets=() flags=(-e)
  local cwd="." sid="" coe=0 docker=0 heavy=0 always=0 cond="" condtext="" body="" note="" tmo="" cleanup_cmd="" install=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env) envs+=("$2"); shift 2 ;;
      --cwd) cwd=$2; shift 2 ;;
      --id) sid=$2; shift 2 ;;
      --coe) coe=1; shift ;;
      --docker) docker=1; shift ;;
      --heavy) heavy=1; shift ;;
      --always) always=1; shift ;;
      --shell) read -r -a flags <<<"$2"; shift 2 ;;
      --timeout) tmo=$2; shift 2 ;;
      --cleanup) cleanup_cmd=$2; shift 2 ;;
      --install) install=$2; shift 2 ;;
      --note) note=$2; shift 2 ;;
      --secrets) read -r -a secrets <<<"$2"; shift 2 ;;
      --if) cond=$2; condtext=$3; shift 3 ;;
      --) shift; body=$1; shift; break ;;
      *) echo "run_step: opção interna inválida: $1" >&2; exit 70 ;;
    esac
  done
  if (( JOB_FAILED )) && (( ! always )); then quiet_skip; return 0; fi
  local -a missing=()
  local s
  for s in "${secrets[@]}"; do [[ -n "${!s:-}" ]] || missing+=("$s"); done
  if (( ${#missing[@]} > 0 )); then skip_step "$name" "segredo ${missing[*]} ausente" secret; return 0; fi
  if [[ -n "$cond" ]] && ! eval "$cond"; then skip_step "$name" "if: ${condtext} = false" if; return 0; fi
  if (( heavy && FAST )); then skip_step "$name" "opcional-pesado (--fast)" fast; return 0; fi
  if (( docker )) && ! docker_ok; then skip_step "$name" "sobe containers (docker) — --no-docker/--fast" docker; return 0; fi
  # reuso de node_modules: marca = hash(lockfile + comando de install) gravado após o último install bem-sucedido
  local lockhash="" marker="$ROOT/$cwd/node_modules/.ci-local-lockhash"
  if [[ -n "$install" && -f "$ROOT/$cwd/$install" ]]; then
    lockhash=$( { cat "$ROOT/$cwd/$install" "$ROOT/$cwd/package.json" "$ROOT/$cwd/.npmrc" "$ROOT/$cwd/bunfig.toml" 2>/dev/null; printf '%s\n' "$body" "${envs[@]}"; } | sha256sum | cut -c1-16)
    if (( REUSE )) && [[ -f "$marker" && "$(cat "$marker")" == "$lockhash" ]]; then
      skip_step "$name" "node_modules reutilizado (${install} inalterado desde o último install; --no-reuse desliga)" info
      return 0
    fi
  fi

  echo "${C_B}▶ ${CUR_LABEL} / ${name}${C_0}${note:+ ${C_D}(${note})${C_0}}"
  local t0=$SECONDS rc=0
  local out="$CI_TMP/step_output" envf="$CI_TMP/step_env" pathf="$CI_TMP/step_path" summ="$CI_TMP/step_summary" log="$CI_TMP/step.log"
  : >"$out"; : >"$envf"; : >"$pathf"; : >"$summ"; : >"$log"
  local -a tcmd=()
  tcmd=(timeout --foreground -k 15 "${tmo:-360}m")
  if (( VERBOSE )); then
    {
    (
      cd "$ROOT/$cwd" || exit 1
      PATH="${JOB_PATH_PREPEND}${JOB_PATH_PREFIX}${PATH}" \
      GITHUB_OUTPUT="$out" GITHUB_ENV="$envf" GITHUB_PATH="$pathf" GITHUB_STEP_SUMMARY="$summ" \
        exec "${tcmd[@]}" setsid "$CI_TMP/launch.sh" env "${JOB_ENV_KV[@]}" "${envs[@]}" bash --noprofile --norc "${flags[@]}" -c "$body"
    ) 2>&1 | tee "$log"; rc=${PIPESTATUS[0]}; } || true
  else
    (
      cd "$ROOT/$cwd" || exit 1
      PATH="${JOB_PATH_PREPEND}${JOB_PATH_PREFIX}${PATH}" \
      GITHUB_OUTPUT="$out" GITHUB_ENV="$envf" GITHUB_PATH="$pathf" GITHUB_STEP_SUMMARY="$summ" \
        exec "${tcmd[@]}" setsid "$CI_TMP/launch.sh" env "${JOB_ENV_KV[@]}" "${envs[@]}" bash --noprofile --norc "${flags[@]}" -c "$body"
    ) >"$log" 2>&1 || rc=$?
  fi
  [[ -n "$cleanup_cmd" ]] && add_cleanup "$cleanup_cmd"
  parse_github_output "$out" "$sid"
  parse_github_env "$envf"
  parse_github_path "$pathf"
  local dt=$((SECONDS - t0))
  if (( rc == 0 )); then
    echo "${C_G}✔${C_0} ${CUR_LABEL} / ${name} ${C_D}(${dt}s)${C_0}"
    STEP_OK=$((STEP_OK + 1))
    [[ -n "$sid" ]] && STEP_OUT["$sid.outcome"]=success
    [[ -n "$lockhash" && -d "$ROOT/$cwd/node_modules" ]] && printf '%s' "$lockhash" >"$marker"
  else
    local why="rc=${rc}"
    (( rc == 124 )) && why="timeout ${tmo}m (como no CI)"
    if (( coe )); then
      echo "${C_Y}✔${C_0} ${CUR_LABEL} / ${name} ${C_D}(${dt}s; ${why}, continue-on-error)${C_0}"
      STEP_OK=$((STEP_OK + 1))
    else
      echo "${C_R}✘${C_0} ${CUR_LABEL} / ${name} ${C_D}(${dt}s; ${why})${C_0}"
      STEP_FAIL=$((STEP_FAIL + 1))
      JOB_FAILED=1
    fi
    if (( ! VERBOSE )); then
      echo "${C_D}── últimas linhas de ${name}:${C_0}"
      tail -n 60 "$log" | sed 's/^/    /'
    fi
    [[ -n "$sid" ]] && STEP_OUT["$sid.outcome"]=failure
  fi
  return 0
}

# agregador emulado (lógica real de cada gate): "job:regra ..." (regra: must | skipok | docs_only) "advisory ..."
job_aggregate() {
  local item j rule r ok inconcl=0 docs_only
  docs_only=$(job_out changes docs_only)
  echo "  ${C_D}(agregador emulado com a lógica do workflow sobre os resultados locais; o script literal não roda)${C_0}"
  for item in $1; do
    j=${item%%:*}; rule=${item#*:}; [[ "$rule" == "$item" ]] && rule=must
    r=${JOB_RESULT[$j]:-pending}
    case "$r" in
      success) echo "  ${C_G}✔${C_0} $j: success" ;;
      failure) echo "  ${C_R}✘${C_0} $j: failure"; JOB_FAILED=1 ;;
      skipped_ci)
        ok=0
        [[ "$rule" == skipok ]] && ok=1
        [[ "$rule" == docs_only && "$docs_only" == true ]] && ok=1
        if (( ok )); then echo "  ${C_G}✔${C_0} $j: skipped (aceito pelo gate)"
        else echo "  ${C_R}✘${C_0} $j: skipped — o gate exige success"; JOB_FAILED=1; fi ;;
      inconclusive) echo "  ${C_Y}?${C_0} $j: INCONCLUSIVO (steps bloqueantes pulados localmente)"; inconcl=1 ;;
      assumed) echo "  ${C_Y}?${C_0} $j: não verificado (cloud-only)"; inconcl=1 ;;
      *) echo "  ${C_Y}?${C_0} $j: não verificado (pulado localmente)"; inconcl=1 ;;
    esac
  done
  for j in ${2:-}; do
    r=${JOB_RESULT[$j]:-pending}
    case "$r" in
      success) echo "  ${C_G}✔${C_0} $j: success (advisory)" ;;
      failure) echo "  ${C_Y}!${C_0} $j: failure (advisory — não bloqueia)" ;;
      *) echo "  ${C_Y}?${C_0} $j: não verificado (advisory)" ;;
    esac
  done
  (( inconcl )) && JOB_INCONCL=1
  return 0
}

service_pg_start() { # imagem porta-map env...  → 0 ok | 1 falhou | 2 porta ocupada (inconclusivo)
  local image=$1 ports=$2; shift 2
  local hostport=${ports%%:*} name="ci-local-pg-$$-$RANDOM" e i
  local -a envargs=()
  for e in "$@"; do envargs+=(-e "$e"); done
  /usr/bin/docker ps -aq --filter label=ci-local=1 --filter status=exited 2>/dev/null | xargs -r /usr/bin/docker rm -f >/dev/null 2>&1 || true
  if ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${hostport}$"; then
    echo "  ${C_Y}⚠ porta ${hostport} já está em uso (Postgres/Supabase local?) — serviço postgres não sobe${C_0}"
    return 2
  fi
  echo "  ${C_D}▶ serviço postgres: /usr/bin/docker run -d --name $name -p $ports ${image}${C_0}"
  if ! /usr/bin/docker run -d --name "$name" --label ci-local=1 -p "$ports" "${envargs[@]}" "$image" >/dev/null; then
    echo "  ${C_R}✘ não consegui subir o serviço postgres${C_0}"
    return 1
  fi
  add_cleanup "/usr/bin/docker rm -f $name"
  for i in $(seq 1 60); do
    if /usr/bin/docker exec "$name" pg_isready -U postgres >/dev/null 2>&1; then
      echo "  ${C_D}serviço postgres pronto (${i}s)${C_0}"; return 0
    fi
    sleep 1
  done
  echo "  ${C_R}✘ serviço postgres não ficou pronto em 60s${C_0}"
  return 1
}

ver_check() { # ferramenta esperado atual
  if [[ -z "$3" ]]; then
    echo "${C_Y}⚠ versão:${C_0} $1 não encontrado no PATH (workflow usa $2)"
  elif [[ "$3" != "$2"* ]]; then
    echo "${C_Y}⚠ versão:${C_0} $1 instalado = $3, workflow usa $2 (seguindo com a instalada)"
  fi
}

wf_hash_check() {
  local atual f
  local -a files=()
  for f in $CI_WF_FILES; do [[ -f "$f" ]] && files+=("$f"); done
  (( ${#files[@]} )) || return 0
  atual=$(cat "${files[@]}" | sha256sum | cut -c1-16)
  if [[ "$atual" != "$CI_WF_HASH" ]]; then
    echo "${C_Y}⚠ os workflows (${CI_WF_FILES}) mudaram desde a geração deste script (${CI_GERADO_EM}): regenere com gera_ci_local.py — o resultado pode divergir do CI${C_0}"
  fi
}

in_csv() { # valor lista,csv
  local IFS=,; local x
  for x in $2; do [[ "$x" == "$1" ]] && return 0; done
  return 1
}
validate_ids() { # lista,csv rótulo
  local IFS=,; local x bad=""
  for x in $1; do [[ -n "${JOB_NAME[$x]+x}" ]] || bad="$bad $x"; done
  if [[ -n "$bad" ]]; then echo "$2: job(s) inexistente(s):$bad (veja --list)" >&2; exit 2; fi
}

print_list() {
  local id req mark
  printf '%s\n' "ci-local — ${CI_REPO}  (gerado ${CI_GERADO_EM} a partir de ${CI_WORKFLOWS})"
  printf '%s\n' "Checks obrigatórios na main (${CI_GERADO_EM}): ${CI_REQUIRED_CHECKS}"
  [[ -n "${CI_LIST_NOTAS:-}" ]] && printf '%s\n' "${CI_LIST_NOTAS}"
  wf_hash_check
  echo
  printf '%-26s %-7s %-15s %s\n' "job" "obrig." "classe" "check — o que pula"
  printf '%-26s %-7s %-15s %s\n' "---" "------" "------" "------------------"
  for id in "${JOB_ORDER[@]}"; do
    req=${JOB_REQ[$id]}
    case "$req" in
      req) mark="[REQ]" ;;
      via:*) mark="[REQ*]" ;;
      ci) mark="[ci]" ;;
      *) mark="[opt]" ;;
    esac
    printf '%-26s %-7s %-15s %s\n' "$id" "$mark" "${JOB_CLASS[$id]}" "${JOB_NAME[$id]}${JOB_STATIC_SKIPS[$id]:+ — pula: ${JOB_STATIC_SKIPS[$id]}}"
  done
  echo
  echo "[REQ] check obrigatório na main · [REQ*] exigido via agregador obrigatório · [ci] sem proteção na main (espelho) · [opt] só com --only"
}

only_closure() { # acrescenta ao --only os jobs provedores de outputs (needs transitivos) dos selecionados
  local changed=1 id n extra=""
  while (( changed )); do
    changed=0
    for id in "${JOB_ORDER[@]}"; do
      in_csv "$id" "$ONLY" || continue
      for n in ${JOB_NEEDS[$id]}; do
        if [[ "${JOB_PROVIDER[$n]}" == 1 ]] && ! in_csv "$n" "$ONLY" && ! in_csv "$n" "$SKIPS"; then
          ONLY="$ONLY,$n"; extra="$extra $n"; changed=1
        fi
      done
    done
  done
  [[ -n "$extra" ]] && echo "${C_D}--only: incluindo jobs provedores de outputs:${extra}${C_0}"
  return 0
}

selected() { # id -> 0 se deve rodar
  local id=$1
  in_csv "$id" "$SKIPS" && return 1
  if [[ -n "$ONLY" ]]; then in_csv "$id" "$ONLY"; return $?; fi
  [[ "${JOB_REQ[$id]}" != opt ]]
}
only_forced() { # job nomeado explicitamente em --only: roda mesmo com if: dependente de outro job
  [[ -n "$ONLY_EXPLICIT" ]] && in_csv "$CUR_JOB" "$ONLY_EXPLICIT"
}

run_jobs() {
  local id n fn dep_failed
  for id in "${JOB_ORDER[@]}"; do
    if ! selected "$id"; then
      JOB_RESULT[$id]=deselected   # p/ needs/if dos outros jobs conta como success (como no CI)
      if in_csv "$id" "$SKIPS"; then JOB_RUNTIME_SKIPS[$id]="--skip"
      elif [[ -n "$ONLY" ]]; then JOB_RUNTIME_SKIPS[$id]="fora de --only"
      else JOB_RUNTIME_SKIPS[$id]="opcional (rode com --only $id)"; fi
      continue
    fi
    if [[ "${JOB_CLOUD[$id]}" == 1 ]] && ! { [[ -n "$ONLY" ]] && in_csv "$id" "$ONLY"; }; then
      JOB_RESULT[$id]=assumed
      JOB_RUNTIME_SKIPS[$id]="cloud-only: ${JOB_STATIC_SKIPS[$id]}"
      echo
      echo "${C_Y}↷ SKIP${C_0} ${id} — ${JOB_NAME[$id]}: cloud-only (${JOB_STATIC_SKIPS[$id]}) — não verificado localmente"
      continue
    fi
    if [[ "${JOB_HEAVY[$id]}" == 1 ]] && (( FAST )); then
      JOB_RESULT[$id]=skipped_local; JOB_RUNTIME_SKIPS[$id]="opcional-pesado (--fast)"
      echo; echo "${C_Y}↷ SKIP${C_0} ${id} — ${JOB_NAME[$id]}: opcional-pesado (--fast)"
      continue
    fi
    if [[ "${JOB_DOCKER[$id]}" == 1 ]] && ! docker_ok; then
      JOB_RESULT[$id]=skipped_local; JOB_RUNTIME_SKIPS[$id]="precisa de docker (--no-docker/--fast)"
      echo; echo "${C_Y}↷ SKIP${C_0} ${id} — ${JOB_NAME[$id]}: precisa de docker (--no-docker/--fast)"
      continue
    fi
    dep_failed=""
    for n in ${JOB_NEEDS[$id]}; do
      [[ "${JOB_RESULT[$n]:-pending}" == failure ]] && dep_failed="$n"
    done
    if [[ -n "$dep_failed" && "${JOB_AGG[$id]}" != 1 ]]; then
      JOB_RESULT[$id]=skipped_ci; JOB_RUNTIME_SKIPS[$id]="dependência ${dep_failed} falhou"
      echo; echo "${C_Y}↷ SKIP${C_0} ${id} — ${JOB_NAME[$id]}: dependência ${dep_failed} falhou"
      continue
    fi
    fn="job_${id//[^A-Za-z0-9_]/_}"
    "$fn"
    if [[ "${JOB_RESULT[$id]}" == failure ]] && (( ! KEEP_GOING )); then
      echo; echo "${C_R}✘ ${id} falhou — parando (use --keep-going para continuar)${C_0}"
      return 0
    fi
  done
}

run_actionlint() {
  local f files=()
  echo
  if ! git rev-parse -q --verify origin/main >/dev/null 2>&1; then
    echo "actionlint: origin/main não existe localmente — pulado"; return 0
  fi
  while IFS= read -r f; do
    [[ -n "$f" && -f "$f" ]] && files+=("$f")
  done < <({ git diff --name-only origin/main -- .github/workflows/ 2>/dev/null; git ls-files --others --exclude-standard -- .github/workflows/; } | grep -E '\.ya?ml$' | sort -u || true)
  if (( ${#files[@]} == 0 )); then echo "actionlint: nenhum workflow alterado"; return 0; fi
  if ! command -v actionlint >/dev/null 2>&1; then
    echo "${C_Y}actionlint: não instalado — ${#files[@]} workflow(s) alterado(s) sem lint${C_0}"; return 0
  fi
  echo "${C_B}▶ actionlint${C_0} ${files[*]}"
  if actionlint "${files[@]}"; then
    echo "${C_G}✔${C_0} actionlint"
  else
    echo "${C_R}✘${C_0} actionlint"; ACTIONLINT_FAILED=1
  fi
}

print_summary() { # define EXIT_CODE
  local id r t s res col fail=0 inconcl=""
  echo
  printf '%s\n' "${C_B}Resumo${C_0}"
  printf '%-26s | %-14s | %7s | %s\n' "job" "resultado" "tempo" "o que pulou"
  printf '%-26s-+-%-14s-+-%7s-+-%s\n' "--------------------------" "--------------" "-------" "-----------"
  for id in "${JOB_ORDER[@]}"; do
    r=${JOB_RESULT[$id]}; t=${JOB_TIME[$id]}; s=${JOB_RUNTIME_SKIPS[$id]}
    case "$r" in
      success) res="✔ ok"; col=$C_G ;;
      failure) res="✘ FALHOU"; col=$C_R; [[ "${JOB_REQ[$id]}" != opt ]] && fail=1 ;;
      inconclusive) res="? inconcl."; col=$C_Y; [[ "${JOB_REQ[$id]}" != opt ]] && inconcl="$inconcl $id" ;;
      assumed) res="? cloud-only"; col=$C_Y; [[ "${JOB_REQ[$id]}" != opt ]] && inconcl="$inconcl $id" ;;
      skipped_local) res="↷ pulado"; col=$C_Y; [[ "${JOB_REQ[$id]}" != opt ]] && inconcl="$inconcl $id" ;;
      skipped_ci) res="↷ pulado (CI)"; col=$C_D ;;
      deselected) res="— fora"; col=$C_D ;;
      *) res="↷ pulado"; col=$C_Y ;;
    esac
    printf '%-26s | %s%-14s%s | %6ss | %s\n' "$id" "$col" "$res" "$C_0" "$t" "${s:-—}"
  done
  (( ACTIONLINT_FAILED )) && { echo "${C_R}✘ actionlint falhou nos workflows alterados${C_0}"; fail=1; }
  echo
  local escopo="todos os checks obrigatórios"
  [[ -n "$ONLY" ]] && escopo="os jobs selecionados (--only ${ONLY}; os demais não foram verificados)"
  if (( fail )); then
    echo "${C_R}✘ ci-local: há falhas em checks obrigatórios${C_0}"; EXIT_CODE=1
  elif [[ -n "$inconcl" ]]; then
    echo "${C_Y}? ci-local INCONCLUSIVO: checks obrigatórios não verificados localmente:${inconcl}${C_0}"
    EXIT_CODE=0
    if (( STRICT )); then EXIT_CODE=3; fi
  else
    echo "${C_G}✔ ci-local: ${escopo} rodaram e passaram${C_0}"; EXIT_CODE=0
  fi
  return 0
}

EXIT_CODE=0
ONLY_EXPLICIT=""
main() {
  local age
  ci_register_jobs
  if (( LIST )); then print_list; exit 0; fi
  [[ -n "$ONLY" ]] && validate_ids "$ONLY" "--only"
  [[ -n "$SKIPS" ]] && validate_ids "$SKIPS" "--skip"
  ONLY_EXPLICIT=$ONLY
  [[ -n "$ONLY" ]] && only_closure
  export TZ=UTC LANG=C.UTF-8 LC_ALL=C.UTF-8   # runners do GitHub são UTC
  CI_TMP=$(mktemp -d -t ci-local.XXXXXX)
  export CI_TMP
  printf '%s\n' '#!/usr/bin/env bash' 'trap '"'"'kill -TERM -- -$$ 2>/dev/null; sleep 2; kill -KILL -- -$$ 2>/dev/null'"'"' TERM INT' '"$@" & wait $!' >"$CI_TMP/launch.sh"
  chmod +x "$CI_TMP/launch.sh"
  GITHUB_SHA=$(git rev-parse HEAD)
  GITHUB_REF_NAME=$(git branch --show-current 2>/dev/null || true)
  GITHUB_REF_NAME=${GITHUB_REF_NAME:-HEAD}
  CI_FORCE_ALL=0
  if (( ALL_CHANGED )); then
    CI_BASE_SHA=$(git rev-list --max-parents=0 HEAD | tail -n1); CI_FORCE_ALL=1
    echo "${C_Y}--all-changed: todos os arquivos contam como alterados (base = commit raiz)${C_0}"
  elif [[ -n "$BASE_REF" ]]; then
    CI_BASE_SHA=$(git merge-base "$BASE_REF" HEAD 2>/dev/null) || { echo "--base: ref inválida: $BASE_REF" >&2; exit 2; }
  elif git rev-parse -q --verify origin/main >/dev/null 2>&1; then
    CI_BASE_SHA=$(git merge-base origin/main HEAD)
    age=$(( $(date +%s) - $(git log -1 --format=%ct origin/main) ))
    (( age > 7*86400 )) && echo "${C_Y}⚠ origin/main local tem $((age/86400)) dias — rode 'git fetch origin main' para uma base atual${C_0}"
  else
    CI_BASE_SHA=$GITHUB_SHA
  fi
  GITHUB_REPOSITORY=$(git remote get-url origin 2>/dev/null | sed -E 's#\.git$##; s#^.*[:/]([^/]+/[^/]+)$#\1#' || true)
  # arquivos alterados p/ os filtros de caminho: commits desde a base + working tree + novos não rastreados
  CI_CHANGED_FILES="$CI_TMP/changed-files.txt"
  { git diff --name-only "$CI_BASE_SHA" 2>/dev/null; git ls-files --others --exclude-standard; } | grep -v '^scripts/ci-local\.sh$' | sort -u >"$CI_CHANGED_FILES" || true
  if [[ "$CI_BASE_SHA" == "$GITHUB_SHA" ]] && (( ! ALL_CHANGED )); then
    echo "${C_Y}⚠ a base do PR emulado é o próprio HEAD (main, branch já mesclada ou sem commits): só mudanças não commitadas e arquivos novos contam${C_0}"
  fi
  if [[ ! -s "$CI_CHANGED_FILES" ]] && (( ! ALL_CHANGED )); then
    echo "${C_R}✘ nenhum arquivo alterado em relação à base ${CI_BASE_SHA:0:10} (nem commits, nem working tree, nem arquivos novos):${C_0}" >&2
    echo "   os filtros de caminho pulariam todos os jobs e o resultado seria vazio. Use --base <ref> (ex.: --base HEAD~1) ou --all-changed." >&2
    exit 2
  fi
  export GITHUB_SHA GITHUB_REF_NAME CI_BASE_SHA CI_FORCE_ALL CI_CHANGED_FILES GITHUB_REPOSITORY
  export GITHUB_REF="refs/heads/${GITHUB_REF_NAME}" GITHUB_BASE_REF=main GITHUB_HEAD_REF="$GITHUB_REF_NAME"
  export GITHUB_EVENT_NAME=pull_request GITHUB_ACTOR=local GITHUB_RUN_ID=local GITHUB_WORKSPACE="$ROOT"
  export RUNNER_OS=Linux RUNNER_TEMP="$CI_TMP" CI=true
  echo "${C_B}ci-local — ${CI_REPO}${C_0} ${C_D}(${GITHUB_REF_NAME} @ ${GITHUB_SHA:0:10}; base ${CI_BASE_SHA:0:10}; PR emulado)${C_0}"
  wf_hash_check
  ci_version_checks
  ci_env_setup
  run_jobs
  run_actionlint
  print_summary
  exit "$EXIT_CODE"
}

# ───────────────────────── versões (avisa uma vez; não instala) ─────────────────────────
ci_version_checks() {
  ver_check 'bun' '1.3.11' "$({ bun -v; } 2>/dev/null || true)"
  ver_check 'deno' '2.9.5' "$({ deno --version | head -1 | awk '{print $2}'; } 2>/dev/null || true)"
  ver_check 'supabase' '2.22' "$({ supabase --version; } 2>/dev/null || true)"
  return 0
}
ci_env_setup() {
  ci_use_node '18' 0 'engines >=18.18.0 (bun roda tudo)'
  return 0
}

# ───────────────────────── jobs (steps literais dos workflows) ─────────────────────────

job_secret_scan() {
  job_begin 'secret-scan' ''
  local b=""
  [[ -e gitleaks.sarif ]] || add_cleanup 'rm -f "$ROOT/gitleaks.sarif"'
  quiet_skip  # Run actions/checkout (actions/checkout)
  skip_step 'Instalar gitleaks' 'instalação global (gitleaks 8.30.1 já instalado no WSL)' info
  b=$(cat <<'CI_EOF'
set -euo pipefail
# Fetch sem --depth: --depth=1 trunca a main local e quebra o
# git merge-base do step de varredura (BASE vazio → varredura do
# histórico inteiro → achados antigos fora do baseline).
git fetch origin main 2>/dev/null || true
if git show origin/main:.gitleaks-baseline.json >/dev/null 2>&1; then
  # Extrai e ordena fingerprints de ambas as versões
  jq -r '.[].Fingerprint' .gitleaks-baseline.json | sort > ${RUNNER_TEMP}/pr_fps.txt
  git show origin/main:.gitleaks-baseline.json | jq -r '.[].Fingerprint' | sort > ${RUNNER_TEMP}/main_fps.txt
  pr_count=$(wc -l < ${RUNNER_TEMP}/pr_fps.txt)
  main_count=$(wc -l < ${RUNNER_TEMP}/main_fps.txt)
  # Fingerprints na PR ausentes em main → nova supressão detectada
  comm -23 ${RUNNER_TEMP}/pr_fps.txt ${RUNNER_TEMP}/main_fps.txt > ${RUNNER_TEMP}/new_fps.txt
  new_count=$(wc -l < ${RUNNER_TEMP}/new_fps.txt)
  if [ "$new_count" -gt 0 ]; then
    echo "::error::Baseline tem ${new_count} nova(s) supressão(ões) ausentes em main (substituição detectada mesmo sem crescimento de contagem)."
    sed 's/^/  + /' ${RUNNER_TEMP}/new_fps.txt
    echo "Remova o(s) segredo(s) do código; não os suprima no baseline."
    exit 1
  fi
  echo "Baseline: PR=${pr_count} entradas, main=${main_count} — conjunto PR ⊆ main — OK"
else
  echo "Branch main sem baseline ainda — pulando comparação."
fi
CI_EOF
)
  run_step 'Gate baseline só encolhe (etapa 49)' --timeout '10' --note '/tmp/ → $RUNNER_TEMP/' -- "$b"
  b=$(cat <<'CI_EOF'
# HEAD é o merge ref do PR (refs/pull/N/merge): o 1º pai é a main na
# época do merge — escopo determinístico que não depende do estado
# local de origin/main.
if git rev-parse --verify -q HEAD^2 >/dev/null 2>&1; then
  BASE=$(git rev-parse HEAD^1)
elif [ "pull_request" = "push" ] && [ -n "" ] && [ "" != "0000000000000000000000000000000000000000" ]; then
  # Em push, origin/main já aponta para o HEAD novo: merge-base
  # devolve o próprio HEAD e `HEAD..HEAD` varreria zero commits.
  # O `before` do evento é o sha anterior de main — o escopo certo.
  # (SHA todo-zero = primeiro push que cria a branch: sem base.)
  BASE=""
else
  BASE=$(git merge-base origin/main HEAD 2>/dev/null || echo "")
fi
if [ -n "$BASE" ]; then
  LOG_OPTS="${BASE}..HEAD"
else
  LOG_OPTS="HEAD"
fi
gitleaks git \
  --no-banner \
  --redact \
  --log-opts="${LOG_OPTS}" \
  --baseline-path .gitleaks-baseline.json \
  --report-format sarif \
  --report-path gitleaks.sarif
CI_EOF
)
  run_step 'Varredura de segredos' --timeout '10' -- "$b"
  skip_step 'Publicar SARIF no Code Scanning' 'action que depende da API/artefatos do GitHub' info
  quiet_skip  # Publicar relatório (actions/upload-artifact)
  job_end
}

job_quality_gate() {
  job_begin 'quality-gate' ''
  local b=""
  quiet_skip  # Run actions/checkout (actions/checkout)
  # composite ./.github/actions/setup-bun (sem inputs)
  quiet_skip  # Setup Bun (oven-sh/setup-bun)
  quiet_skip  # Cache node_modules (actions/cache)
  b=$(cat <<'CI_EOF'
bun install --frozen-lockfile --ignore-scripts
CI_EOF
)
  run_step 'Install dependencies' --if '[[ "$(step_out bun-cache cache-hit)" != "true" ]]' 'steps.bun-cache.outputs.cache-hit != '\''true'\''' --shell '-eo pipefail' --timeout '30' --install bun.lock -- "$b"
  b=$(cat <<'CI_EOF'
bun audit --ignore=GHSA-vfj7-8cjw-p6xm --ignore=GHSA-gcqx-w48m-w2h4 --ignore=GHSA-mrhx-c7xc-m3w5 --ignore=GHSA-rj75-hqrm-r3gf --ignore=GHSA-587h-7wmj-h5pm --ignore=GHSA-698v-4r3x-3vcv --ignore=GHSA-r825-w8mm-5pxw --ignore=GHSA-9jrq-w75r-8gcw --ignore=GHSA-rq7h-c2jc-7f22 --ignore=GHSA-vfpm-58rq-9qcg --ignore=GHSA-qxg6-89mg-rqv8 --ignore=GHSA-xp26-3454-mjgp --ignore=GHSA-g3hv-75wg-m249 --ignore=GHSA-3g3m-2fjr-6pw4
CI_EOF
)
  run_step 'Security scan' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/check-external-secret-isolation.sh
CI_EOF
)
  run_step 'External secret isolation guard' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/security/zod-coverage.sh
CI_EOF
)
  run_step 'Zod coverage gate (edge functions)' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
node --test scripts/security/test-canonical-db-gates.test.mjs
CI_EOF
)
  run_step 'Gate offline do banco canônico' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/security/test-migration-replay-safety.sh
CI_EOF
)
  run_step 'Replay safety das migrations críticas' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
python3 scripts/security/test-supabase-config.py
CI_EOF
)
  run_step 'Integridade do Supabase config' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/security/test-functions-deploy.sh
CI_EOF
)
  run_step 'Contrato de deploy das Edge Functions' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
node scripts/security/test-lint-function-repairs.mjs
CI_EOF
)
  run_step 'Gate estático do reparo SQL' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
BASE=$(git merge-base origin/main HEAD)
FILES=$(git diff --name-only --diff-filter=ACMR "$BASE" HEAD -- 'src/**/*.ts' 'src/**/*.tsx' 'src/**/*.css' 'src/**/*.json' 'supabase/functions/**/*.ts')
if [ -n "$FILES" ]; then
  echo "$FILES" | xargs bunx prettier --check
else
  echo "Nenhum arquivo formatável alterado — gate aprovado."
fi
CI_EOF
)
  run_step 'Format check (arquivos alterados)' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bun run lint
CI_EOF
)
  run_step 'Lint check' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/ci/require-env.sh \
  --label "Quality Gate — DATABASE_URL" \
  --mode summary \
  --output available \
  DATABASE_URL
CI_EOF
)
  run_step 'Preflight dos gates com DATABASE_URL' --id 'db_url_preflight' --env "DATABASE_URL=${DATABASE_URL:-}" --timeout '30' --note 'require-env.sh --mode summary só registra; define steps.db_url_preflight.outputs.available' -- "$b"
  b=$(cat <<'CI_EOF'
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/security/test-observability-privileges.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/security/test-security-definer-invocation.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/tests/sql/rls_multi_empresa.sql
CI_EOF
)
  run_step 'Observability privileges guard (psql)' --env "DATABASE_URL=${DATABASE_URL:-}" --secrets 'DATABASE_URL' --if '[[ "$(step_out db_url_preflight available)" == "true" ]]' 'steps.db_url_preflight.outputs.available == '\''true'\''' --timeout '30' --note 'sem o sudo apt-get install postgresql-client (psql já instalado)' -- "$b"
  b=$(cat <<'CI_EOF'
set -euo pipefail
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/tests/sql/catalogos_tributarios.test.sql 2>&1 | tee catalogos.tap
if grep -q "not ok" catalogos.tap; then
  echo "::error::Catálogos tributários com invariantes violadas."
  grep "not ok" catalogos.tap
  exit 1
fi
echo "✅ Catálogos tributários íntegros."
CI_EOF
)
  run_step 'Integridade dos catálogos tributários (pgTAP)' --env "DATABASE_URL=${DATABASE_URL:-}" --secrets 'DATABASE_URL' --if '[[ "$(step_out db_url_preflight available)" == "true" ]]' 'steps.db_url_preflight.outputs.available == '\''true'\''' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
set -euo pipefail
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/integrity/14_retencao.sql 2>&1 | tee retencao.tsv
if grep -qP '\tfail\t' retencao.tsv; then
  echo "::error::Gate #35 reprovado — tabela de log sem política de retenção."
  grep -P '\tfail\t' retencao.tsv
  exit 1
fi
echo "✅ Gate #35 aprovado."
CI_EOF
)
  run_step 'Gate' --env "DATABASE_URL=${DATABASE_URL:-}" --secrets 'DATABASE_URL' --if '[[ "$(step_out db_url_preflight available)" == "true" ]]' 'steps.db_url_preflight.outputs.available == '\''true'\''' --timeout '30' -- "$b"
  if [[ "$(step_out db_url_preflight available)" != "true" ]]; then skip_step 'Registrar gates de banco como inconclusivos sem DATABASE_URL' 'so escreve GITHUB_STEP_SUMMARY' info; else quiet_skip; fi
  b=$(cat <<'CI_EOF'
bash scripts/ci/require-env.sh \
  --label "Quality Gate — Runtime RPC" \
  SUPABASE_URL SUPABASE_ANON_KEY E2E_USER_EMAIL E2E_USER_PASSWORD
CI_EOF
)
  run_step 'Preflight do gate Runtime RPC' --env "SUPABASE_URL=${SUPABASE_URL:-}" --env "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}" --env "E2E_USER_EMAIL=${E2E_USER_EMAIL:-}" --env "E2E_USER_PASSWORD=${E2E_USER_PASSWORD:-}" --secrets 'E2E_USER_EMAIL E2E_USER_PASSWORD SUPABASE_ANON_KEY SUPABASE_URL' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bun run scripts/security/test-rpc-runtime.ts
CI_EOF
)
  run_step 'Runtime RPC privilege matrix (anon / authenticated)' --env "SUPABASE_URL=${SUPABASE_URL:-}" --env "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}" --env "E2E_USER_EMAIL=${E2E_USER_EMAIL:-}" --env "E2E_USER_PASSWORD=${E2E_USER_PASSWORD:-}" --env "CI_GATE_LOG_SECRET=${CI_GATE_LOG_SECRET:-}" --env "MIGRATION_REVISION=${GITHUB_SHA}" --secrets 'CI_GATE_LOG_SECRET E2E_USER_EMAIL E2E_USER_PASSWORD SUPABASE_ANON_KEY SUPABASE_URL' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/security/export-function-privileges.sh
CI_EOF
)
  run_step 'Export function privileges snapshot (CSV + JSON)' --env "DATABASE_URL=${DATABASE_URL:-}" --env 'OUT_DIR=./artifacts/security' --secrets 'DATABASE_URL' --if '[[ "$(step_out db_url_preflight available)" == "true" ]]' 'steps.db_url_preflight.outputs.available == '\''true'\''' --timeout '30' -- "$b"
  quiet_skip  # Upload function privileges artifact (actions/upload-artifact)
  b=$(cat <<'CI_EOF'
bun run type-check
CI_EOF
)
  run_step 'Type check' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bun run type-check:strict
CI_EOF
)
  run_step 'Ratchet strictNullChecks (baseline só encolhe)' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
bun run type-check:e2e
CI_EOF
)
  run_step 'Type check da infraestrutura de teste' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
mkdir -p test-results
bun run test:run -- --reporter=verbose --reporter=junit --outputFile.junit=test-results/junit.xml
CI_EOF
)
  run_step 'Unit & Integration Tests' --timeout '30' -- "$b"
  quiet_skip  # Publicar resultados JUnit (actions/upload-artifact)
  b=$(cat <<'CI_EOF'
bun run test:coverage
CI_EOF
)
  run_step 'Coverage check' --timeout '30' -- "$b"
  quiet_skip  # Publicar cobertura como artefato (actions/upload-artifact)
  b=$(cat <<'CI_EOF'
bun run build
CI_EOF
)
  run_step 'Build check' --env "VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-https://bwwbeyolnnzppeuhgkcd.supabase.co}" --env "VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID:-bwwbeyolnnzppeuhgkcd}" --env "VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY:-sb_publishable_dependabot_build_only}" --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
set -euo pipefail
THRESHOLD_KB=600
THRESHOLD_BYTES=$((THRESHOLD_KB * 1024))
FAIL=0
while IFS= read -r -d '' chunk; do
  size=$(stat -c%s "$chunk")
  name=$(basename "$chunk")
  if [ "$size" -gt "$THRESHOLD_BYTES" ]; then
    echo "::error::Chunk muito grande: $name ($((size / 1024)) KB > ${THRESHOLD_KB} KB)"
    FAIL=1
  else
    echo "  OK  $name  ($((size / 1024)) KB)"
  fi
done < <(find dist/assets -name "*.js" -print0 2>/dev/null)
[ "$FAIL" -eq 0 ] || exit 1
echo "✅ Todos os chunks JS dentro do limite de ${THRESHOLD_KB} KB."
CI_EOF
)
  run_step 'Gate de tamanho de bundle (etapa 50)' --timeout '30' -- "$b"
  b=$(cat <<'CI_EOF'
set -euo pipefail
node scripts/generate-env-manifest.mjs --check 2>/dev/null || \
  node scripts/generate-env-manifest.mjs
if ! git diff --exit-code env.manifest.json > /dev/null 2>&1; then
  echo "::error::env.manifest.json está desatualizado. Execute 'node scripts/generate-env-manifest.mjs' e commite o resultado."
  git diff env.manifest.json
  exit 1
fi
echo "✅ env.manifest.json atualizado."
CI_EOF
)
  run_step 'Gate env.manifest.json atualizado (etapa 48)' --timeout '30' -- "$b"
  quiet_skip  # Upload Error Logs (actions/upload-artifact)
  job_end
}

job_unit_tests() {
  job_begin 'unit-tests' ''
  local b=""
  quiet_skip  # Checkout (actions/checkout)
  quiet_skip  # Setup Deno (denoland/setup-deno)
  quiet_skip  # Cache Deno dependencies (actions/cache)
  b=$(cat <<'CI_EOF'
deno lint --no-config \
  --rules-exclude=no-import-prefix,no-explicit-any,no-unused-vars,prefer-const,require-await \
  supabase/functions/_shared/auth-guard.ts \
  supabase/functions/_shared/auth-guard_test.ts \
  supabase/functions/_shared/proxy-audit.ts \
  supabase/functions/_shared/sql-write-guard.ts \
  supabase/functions/_shared/sql-write-guard_test.ts \
  supabase/functions/_shared/webhook-auth.ts \
  supabase/functions/_shared/webhook-auth_test.ts \
  supabase/functions/convidar-usuario/index.ts \
  supabase/functions/convidar-usuario/index.test.ts \
  supabase/functions/mcp-query/index.ts \
  supabase/functions/mcp-query/index_test.ts \
  supabase/functions/mcp-query/sql-policy_test.ts \
  supabase/functions/analise-fluxo-ia/index.ts \
  supabase/functions/analise-fluxo-ia/auth_test.ts \
  supabase/functions/analyze-document/index.ts \
  supabase/functions/benchmarking-setorial/index.ts \
  supabase/functions/categorizar-despesa/index.ts \
  supabase/functions/conciliacao-proxy/index.ts \
  supabase/functions/conciliacao-proxy/index_test.ts \
  supabase/functions/nfe-vinculo-proxy/index.ts \
  supabase/functions/nfe-vinculo-proxy/index_test.ts \
  supabase/functions/insights-relatorio/index.ts \
  supabase/functions/enviar-alerta-email/index.ts \
  supabase/functions/enviar-alerta-email/index.test.ts \
  supabase/functions/executar-analise-preditiva/index.ts \
  supabase/functions/executar-analise-preditiva/index.test.ts \
  supabase/functions/gerar-alertas-tributarios/index.ts \
  supabase/functions/gerar-alertas-tributarios/index.test.ts \
  supabase/functions/whatsapp-ia-proativo/index.ts \
  supabase/functions/whatsapp-ia-proativo/index_test.ts
CI_EOF
)
  run_step 'Lint do escopo crítico alterado' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/ci/deno-check-functions.sh
CI_EOF
)
  run_step 'Type-check do escopo endurecido' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
deno test --no-config \
  --allow-env \
  --allow-read \
  --allow-net=0.0.0.0:8000,127.0.0.1,localhost \
  --ignore=supabase/functions/sso-test-login/index.test.ts \
  supabase/functions/
CI_EOF
)
  run_step 'Run unit tests' --env 'SUPABASE_URL=http://localhost:54321' --env 'SUPABASE_SERVICE_ROLE_KEY=test-service-role-key' --env 'SUPABASE_ANON_KEY=test-anon-key' --env 'DENO_TESTING=1' --timeout '10' -- "$b"
  job_end
}

job_supabase_linter() {
  job_begin 'supabase-linter' ''
  local b=""
  quiet_skip  # Run actions/checkout (actions/checkout)
  b=$(cat <<'CI_EOF'
if grep -qE '^(supabase/migrations/|supabase/functions/|scripts/security/|scripts/ci/require-env\.sh|supabase/config\.toml|\.github/workflows/supabase-linter\.yml)' "$CI_CHANGED_FILES"; then
  relevant=true
else
  relevant=false
fi
echo "relevant=$relevant" >> "$GITHUB_OUTPUT"
if [ "$relevant" = "true" ]; then echo "Mudanças no banco detectadas — lint será executado."; else echo "Sem mudanças no banco — lint pulado."; fi
CI_EOF
)
  run_step 'Detect DB file changes' --id 'filter' --env 'EVENT_NAME=pull_request' --env "GITHUB_TOKEN=${GITHUB_TOKEN:-}" --env 'PR_NUMBER=' --timeout '10' --note 'API de arquivos do PR → git diff origin/main...HEAD' -- "$b"
  b=$(cat <<'CI_EOF'
node --test scripts/security/test-canonical-db-gates.test.mjs
CI_EOF
)
  run_step 'Gate offline do banco canônico' --if '[[ "$(step_out filter relevant)" == "true" ]]' 'steps.filter.outputs.relevant == '\''true'\''' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/security/test-migration-replay-safety.sh
CI_EOF
)
  run_step 'Replay safety das migrations críticas' --if '[[ "$(step_out filter relevant)" == "true" ]]' 'steps.filter.outputs.relevant == '\''true'\''' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
node scripts/security/check-view-replay-order.mjs
CI_EOF
)
  run_step 'Ordem de replay de views (CREATE VIEW nu)' --if '[[ "$(step_out filter relevant)" == "true" ]]' 'steps.filter.outputs.relevant == '\''true'\''' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
python3 scripts/security/test-supabase-config.py
CI_EOF
)
  run_step 'Integridade do Supabase config' --if '[[ "$(step_out filter relevant)" == "true" ]]' 'steps.filter.outputs.relevant == '\''true'\''' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
node scripts/security/test-lint-function-repairs.mjs
CI_EOF
)
  run_step 'Gate estático do reparo SQL' --if '[[ "$(step_out filter relevant)" == "true" ]]' 'steps.filter.outputs.relevant == '\''true'\''' --timeout '10' -- "$b"
  if [[ "$(step_out filter relevant)" == "true" ]]; then skip_step 'Setup Supabase CLI' 'supabase CLI já instalado no WSL (2.115.0; o workflow pina 2.22.6)' info; else quiet_skip; fi
  if [[ "$(step_out filter relevant)" == "true" ]]; then skip_step 'Inicializar lint.json' 'só prepara lint.json para o upload-artifact' info; else quiet_skip; fi
  b=$(cat <<'CI_EOF'
bash scripts/ci/require-env.sh \
  --label "Supabase — banco canônico live" \
  SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF
CI_EOF
)
  run_step 'Preflight dos gates live do Supabase' --env "SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-}" --env "SUPABASE_PROJECT_REF=${VITE_SUPABASE_PROJECT_ID:-}" --secrets 'SUPABASE_ACCESS_TOKEN VITE_SUPABASE_PROJECT_ID' --if '[[ "$(step_out filter relevant)" == "true" ]]' 'steps.filter.outputs.relevant == '\''true'\'' && github.actor != '\''dependabot[bot]'\'' && !github.event.pull_request.head.repo.fork' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
node scripts/security/test-canonical-db-gates.mjs
CI_EOF
)
  run_step 'Gate live do banco canônico' --env "SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-}" --env "SUPABASE_PROJECT_REF=${VITE_SUPABASE_PROJECT_ID:-}" --secrets 'SUPABASE_ACCESS_TOKEN VITE_SUPABASE_PROJECT_ID' --if '[[ "$(step_out filter relevant)" == "true" ]]' 'steps.filter.outputs.relevant == '\''true'\'' && github.actor != '\''dependabot[bot]'\'' && !github.event.pull_request.head.repo.fork' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/ci/require-env.sh \
  --label "Supabase linter — DB password" \
  --mode summary \
  --output available \
  SUPABASE_DB_PASSWORD
CI_EOF
)
  run_step 'Preflight DB password' --id 'db_pwd_preflight' --env "SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD:-}" --secrets 'SUPABASE_DB_PASSWORD' --if '[[ "$(step_out filter relevant)" == "true" ]]' 'steps.filter.outputs.relevant == '\''true'\''' --timeout '10' -- "$b"
  b=$(cat <<'CI_EOF'
echo "::error::SUPABASE_DB_PASSWORD não configurado — impossível executar supabase db lint em PR com mudanças de banco. Configure o secret para habilitar a verificação completa de RLS/GRANT."
exit 1
CI_EOF
)
  run_step 'Fail when linter skipped (missing password)' --secrets 'SUPABASE_DB_PASSWORD' --if '( [[ "$(step_out filter relevant)" == "true" ]] && [[ "$(step_out db_pwd_preflight available)" != "true" ]] )' 'steps.filter.outputs.relevant == '\''true'\'' && steps.db_pwd_preflight.outputs.available != '\''true'\'' && github.actor != '\''dependabot[bot]'\'' && !github.event.pull_request.head.repo.fork' --timeout '10' --note 'no CI o segredo existe (environment Production); sem ele aqui o job fica inconclusivo' -- "$b"
  b=$(cat <<'CI_EOF'
set -euo pipefail
# Vincula o CLI ao projeto remoto antes de executar o lint.
# A flag --project-ref não existe em `db lint`; o link é feito aqui.
supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
lint_exit=0
supabase db lint \
  --linked \
  --level warning \
  --output json > lint.json || lint_exit=$?

echo "── Linter output ──"
if ! jq -e '
  (type == "object" and (.results | type == "array"))
  or type == "array"
' lint.json >/dev/null; then
  echo "::error::Supabase linter não produziu o JSON esperado."
  if [ -s lint.json ]; then
    cat lint.json
  fi
  if [ "$lint_exit" -ne 0 ]; then
    exit "$lint_exit"
  fi
  exit 1
fi
cat lint.json

if [ "$lint_exit" -ne 0 ]; then
  echo "::error::Supabase linter detectou ERROR(s) de segurança/RLS/GRANT."
  jq -r --arg f "desconhecida" --arg m "erro sem detalhe" '
    if type == "object" then
      .results[]? as $routine
      | $routine.issues[]?
      | select((.level // "") | ascii_downcase == "error")
      | "- [\($routine.function // $f)] \(.message // $m)"
    else
      .[]?
      | select((.level // "") | ascii_downcase == "error")
      | "- [\(.name // .function // $f)] \(.description // .message // $m)"
    end
  ' lint.json
  exit "$lint_exit"
fi

if jq -e '
  if type == "object" then
    .results[]?.issues[]?
  else
    .[]?
  end
  | select((.level // "") | ascii_downcase == "error")
' lint.json >/dev/null; then
  echo "::error::Supabase linter retornou ERROR no JSON com exit code zero."
  jq -r --arg f "desconhecida" --arg m "erro sem detalhe" '
    if type == "object" then
      .results[]? as $routine
      | $routine.issues[]?
      | select((.level // "") | ascii_downcase == "error")
      | "- [\($routine.function // $f)] \(.message // $m)"
    else
      .[]?
      | select((.level // "") | ascii_downcase == "error")
      | "- [\(.name // .function // $f)] \(.description // .message // $m)"
    end
  ' lint.json
  exit 1
fi

echo "✅ Nenhum ERROR bloqueante de segurança no banco."
CI_EOF
)
  run_step 'Run Supabase linter (fail on ERROR)' --env "SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN:-}" --env "SUPABASE_PROJECT_REF=${VITE_SUPABASE_PROJECT_ID:-}" --env "SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD:-}" --secrets 'SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD VITE_SUPABASE_PROJECT_ID' --if '( [[ "$(step_out filter relevant)" == "true" ]] && [[ "$(step_out db_pwd_preflight available)" == "true" ]] )' 'steps.filter.outputs.relevant == '\''true'\'' && steps.db_pwd_preflight.outputs.available == '\''true'\'' && github.actor != '\''dependabot[bot]'\'' && !github.event.pull_request.head.repo.fork' --timeout '10' -- "$b"
  quiet_skip  # Upload linter report (actions/upload-artifact)
  job_end
}

job_e2e_financeiro() {
  job_begin 'e2e-financeiro' ''
  local b=""
  quiet_skip  # Run actions/checkout (actions/checkout)
  # composite ./.github/actions/setup-bun (sem inputs)
  quiet_skip  # Setup Bun (oven-sh/setup-bun)
  quiet_skip  # Cache node_modules (actions/cache)
  b=$(cat <<'CI_EOF'
bun install --frozen-lockfile --ignore-scripts
CI_EOF
)
  run_step 'Install dependencies' --if '[[ "$(step_out bun-cache cache-hit)" != "true" ]]' 'steps.bun-cache.outputs.cache-hit != '\''true'\''' --shell '-eo pipefail' --timeout '20' --install bun.lock -- "$b"
  # composite ./.github/actions/setup-playwright (cache-id=pw)
  quiet_skip  # Cache Playwright browsers (actions/cache)
  b=$(cat <<'CI_EOF'
./node_modules/.bin/playwright install chromium
CI_EOF
)
  run_step 'Install Playwright browsers' --if '[[ "$(step_out pw-cache cache-hit)" != "true" ]]' 'steps.pw-cache.outputs.cache-hit != '\''true'\''' --heavy --shell '-eo pipefail' --timeout '20' --note 'sem --with-deps (sudo apt)' -- "$b"
  b=$(cat <<'CI_EOF'
bunx playwright test --config=playwright.financeiro.config.ts --project=chromium --reporter=list
CI_EOF
)
  run_step 'E2E financeiro obrigatório' --env 'CI=true' --heavy --timeout '20' -- "$b"
  quiet_skip  # Publicar artefatos de falha (actions/upload-artifact)
  job_end
}

job_e2e_critical() {
  job_begin 'e2e-critical' ''
  local b=""
  quiet_skip  # Run actions/checkout (actions/checkout)
  # composite ./.github/actions/setup-bun (sem inputs)
  quiet_skip  # Setup Bun (oven-sh/setup-bun)
  quiet_skip  # Cache node_modules (actions/cache)
  b=$(cat <<'CI_EOF'
bun install --frozen-lockfile --ignore-scripts
CI_EOF
)
  run_step 'Install dependencies' --if '[[ "$(step_out bun-cache cache-hit)" != "true" ]]' 'steps.bun-cache.outputs.cache-hit != '\''true'\''' --shell '-eo pipefail' --timeout '25' --install bun.lock -- "$b"
  # composite ./.github/actions/setup-playwright (cache-id=pw)
  quiet_skip  # Cache Playwright browsers (actions/cache)
  b=$(cat <<'CI_EOF'
./node_modules/.bin/playwright install chromium
CI_EOF
)
  run_step 'Install Playwright browsers' --if '[[ "$(step_out pw-cache cache-hit)" != "true" ]]' 'steps.pw-cache.outputs.cache-hit != '\''true'\''' --heavy --shell '-eo pipefail' --timeout '25' --note 'sem --with-deps (sudo apt)' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/ci/require-env.sh \
  --label "E2E crítico" \
  E2E_USER_EMAIL E2E_USER_PASSWORD SUPABASE_URL SUPABASE_ANON_KEY VITE_SUPABASE_PROJECT_ID
CI_EOF
)
  run_step 'Preflight E2E crítico' --env "E2E_USER_EMAIL=${E2E_USER_EMAIL:-}" --env "E2E_USER_PASSWORD=${E2E_USER_PASSWORD:-}" --env "SUPABASE_URL=${SUPABASE_URL:-}" --env "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}" --env "VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID:-}" --secrets 'E2E_USER_EMAIL E2E_USER_PASSWORD SUPABASE_ANON_KEY SUPABASE_URL VITE_SUPABASE_PROJECT_ID' --timeout '25' -- "$b"
  b=$(cat <<'CI_EOF'
bunx playwright test -c playwright.critical.config.ts --project=chromium --reporter=list
CI_EOF
)
  run_step 'E2E crítico obrigatório' --env "E2E_USER_EMAIL=${E2E_USER_EMAIL:-}" --env "E2E_USER_PASSWORD=${E2E_USER_PASSWORD:-}" --env "SUPABASE_URL=${SUPABASE_URL:-}" --env "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}" --env "VITE_SUPABASE_URL=${SUPABASE_URL:-}" --env "VITE_SUPABASE_PUBLISHABLE_KEY=${SUPABASE_ANON_KEY:-}" --env "VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID:-}" --env 'CI=true' --secrets 'E2E_USER_EMAIL E2E_USER_PASSWORD SUPABASE_ANON_KEY SUPABASE_URL VITE_SUPABASE_PROJECT_ID' --heavy --timeout '25' -- "$b"
  quiet_skip  # Publicar artefatos de falha E2E crítico (etapa 62) (actions/upload-artifact)
  job_end
}

job_e2e_destructive() {
  job_begin 'e2e-destructive' ''
  local b=""
  quiet_skip  # Run actions/checkout (actions/checkout)
  # composite ./.github/actions/setup-bun (sem inputs)
  quiet_skip  # Setup Bun (oven-sh/setup-bun)
  quiet_skip  # Cache node_modules (actions/cache)
  b=$(cat <<'CI_EOF'
bun install --frozen-lockfile --ignore-scripts
CI_EOF
)
  run_step 'Install dependencies' --if '[[ "$(step_out bun-cache cache-hit)" != "true" ]]' 'steps.bun-cache.outputs.cache-hit != '\''true'\''' --shell '-eo pipefail' --timeout '15' --install bun.lock -- "$b"
  # composite ./.github/actions/setup-playwright (cache-id=pw)
  quiet_skip  # Cache Playwright browsers (actions/cache)
  b=$(cat <<'CI_EOF'
./node_modules/.bin/playwright install chromium
CI_EOF
)
  run_step 'Install Playwright browsers' --if '[[ "$(step_out pw-cache cache-hit)" != "true" ]]' 'steps.pw-cache.outputs.cache-hit != '\''true'\''' --heavy --shell '-eo pipefail' --timeout '15' --note 'sem --with-deps (sudo apt)' -- "$b"
  b=$(cat <<'CI_EOF'
bash scripts/ci/require-env.sh \
  --label "E2E destrutivo" \
  E2E_USER_EMAIL E2E_USER_PASSWORD SUPABASE_URL SUPABASE_ANON_KEY VITE_SUPABASE_PROJECT_ID
CI_EOF
)
  run_step 'Preflight E2E destrutivo' --env "E2E_USER_EMAIL=${E2E_USER_EMAIL:-}" --env "E2E_USER_PASSWORD=${E2E_USER_PASSWORD:-}" --env "SUPABASE_URL=${SUPABASE_URL:-}" --env "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}" --env "VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID:-}" --secrets 'E2E_USER_EMAIL E2E_USER_PASSWORD SUPABASE_ANON_KEY SUPABASE_URL VITE_SUPABASE_PROJECT_ID' --timeout '15' -- "$b"
  b=$(cat <<'CI_EOF'
bunx playwright test -c playwright.destructive.config.ts --project=chromium-destructive --reporter=list
CI_EOF
)
  run_step 'E2E Logout Destrutivo' --env "E2E_USER_EMAIL=${E2E_USER_EMAIL:-}" --env "E2E_USER_PASSWORD=${E2E_USER_PASSWORD:-}" --env "SUPABASE_URL=${SUPABASE_URL:-}" --env "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}" --env "VITE_SUPABASE_URL=${SUPABASE_URL:-}" --env "VITE_SUPABASE_PUBLISHABLE_KEY=${SUPABASE_ANON_KEY:-}" --env "VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID:-}" --env 'CI=true' --secrets 'E2E_USER_EMAIL E2E_USER_PASSWORD SUPABASE_ANON_KEY SUPABASE_URL VITE_SUPABASE_PROJECT_ID' --heavy --timeout '15' -- "$b"
  quiet_skip  # Publicar artefatos de falha E2E destrutivo (etapa 62) (actions/upload-artifact)
  job_end
}

job_integration_tests() {
  job_begin 'integration-tests' ''
  local b=""
  quiet_skip  # Checkout (actions/checkout)
  quiet_skip  # Setup Deno (denoland/setup-deno)
  quiet_skip  # Cache Deno dependencies (actions/cache)
  b=$(cat <<'CI_EOF'
bash scripts/ci/require-env.sh \
  --label "Deno — integração live" \
  VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY
CI_EOF
)
  run_step 'Preflight da integração live' --env "VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-}" --env "VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY:-}" --secrets 'VITE_SUPABASE_PUBLISHABLE_KEY VITE_SUPABASE_URL' --timeout '15' -- "$b"
  b=$(cat <<'CI_EOF'
deno test --no-config \
  --allow-net \
  --allow-env \
  --allow-read \
  --no-check \
  supabase/functions/sso-test-login/index.test.ts
CI_EOF
)
  run_step 'Run integration tests against deployed edge functions' --env "VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-}" --env "VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY:-}" --secrets 'VITE_SUPABASE_PUBLISHABLE_KEY VITE_SUPABASE_URL' --timeout '15' -- "$b"
  job_end
}

ci_register_jobs() {
  reg_job 'secret-scan' 'Varredura de segredos (gitleaks)' 'ci.yml' 'req' 'local' '' 'Instalar gitleaks (instalação global (gitleaks 8.30.1 já instalado no WSL)); Publicar SARIF no Code Scanning (action que depende da API/artefatos do GitHub)' 0 0 0 0 0
  reg_job 'quality-gate' 'Quality Gate & Tests' 'ci.yml' 'req' 'parcial' '' 'Registrar gates de banco como inconclusivos sem DATABASE_URL (so escreve GITHUB_STEP_SUMMARY); segredos: CI_GATE_LOG_SECRET, DATABASE_URL, E2E_USER_EMAIL, E2E_USER_PASSWORD, SUPABASE_ANON_KEY, SUPABASE_URL' 0 0 0 0 0
  reg_job 'unit-tests' 'Unit tests (offline, deterministic)' 'deno-tests.yml' 'req' 'local' '' '' 0 0 0 0 0
  reg_job 'supabase-linter' 'Supabase DB Linter' 'supabase-linter.yml' 'req' 'parcial' '' 'Setup Supabase CLI (supabase CLI já instalado no WSL (2.115.0; o workflow pina 2); Inicializar lint.json (só prepara lint.json para o upload-artifact); segredos: SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD, VITE_SUPABASE_PROJECT_ID' 0 0 0 0 0
  reg_job 'e2e-financeiro' 'E2E Financeiro (offline)' 'ci.yml' 'req' 'opcional-pesado' '' '2 step(s) pesados' 1 0 0 0 0
  reg_job 'e2e-critical' 'E2E Critical Gate' 'ci.yml' 'req' 'cloud-only' '' '2 step(s) pesados; segredos: E2E_USER_EMAIL, E2E_USER_PASSWORD, SUPABASE_ANON_KEY, SUPABASE_URL, VITE_SUPABASE_PROJECT_ID' 0 0 1 0 0
  reg_job 'e2e-destructive' 'E2E Destructive Logout' 'ci.yml' 'req' 'cloud-only' 'quality-gate e2e-critical' '2 step(s) pesados; segredos: E2E_USER_EMAIL, E2E_USER_PASSWORD, SUPABASE_ANON_KEY, SUPABASE_URL, VITE_SUPABASE_PROJECT_ID' 0 0 1 0 0
  reg_job 'integration-tests' 'Integration tests (edge functions live)' 'deno-tests.yml' 'req' 'cloud-only' 'unit-tests' 'segredos: VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_URL' 0 0 1 0 0
}

main "$@"
