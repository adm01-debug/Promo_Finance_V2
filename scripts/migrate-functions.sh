#!/usr/bin/env bash
# scripts/migrate-functions.sh
# Deploy em lote das Edge Functions para um projeto Supabase destino.
#
# Uso:
#   ./scripts/migrate-functions.sh [--dry-run] [--only fn1,fn2]
#
# Env obrigatórias:
#   SUPABASE_ACCESS_TOKEN=sbp_...
#   SUPABASE_PROJECT_REF=<ref do projeto destino>
#
# Env opcionais:
#   REQUIRED_SECRETS="LOVABLE_API_KEY,RESEND_API_KEY,..."   # aborta se faltar;
#                                                           # ausente, cai nos
#                                                           # `supabase_vault` required=true do env.manifest.json
#   FUNCTIONS_DIR=supabase/functions                        # default
#   STOP_ON_FAIL=1                                          # aborta no 1º deploy que falhar
#   DEPLOY_LOG_DIR=/tmp                                     # default; pasta do log JSONL
#
# Saída: /tmp/deploy-log-YYYYMMDD-HHMM-<pid>.jsonl

set -euo pipefail

DRY_RUN=0
ONLY=""
ONLY_SET=0
FUNCTIONS_DIR="${FUNCTIONS_DIR:-supabase/functions}"
CONFIG_TOML="supabase/config.toml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --only)
      [[ $# -ge 2 ]] || { echo "--only exige uma lista de functions (fn1,fn2)" >&2; exit 2; }
      ONLY="$2"; ONLY_SET=1; shift 2 ;;
    -h|--help)
      sed -n '2,21p' "$0"; exit 0 ;;
    *) echo "Argumento desconhecido: $1" >&2; exit 2 ;;
  esac
done

# `--only ""` (input vazio do workflow, variável não definida) não pode virar
# deploy em lote de TODAS as functions: a lista é normalizada (trim, sem
# vazios, sem repetição) e precisa sobrar ao menos um nome válido.
declare -a ONLY_FNS=()
if [[ $ONLY_SET -eq 1 ]]; then
  IFS=',' read -ra _only_raw <<< "$ONLY"
  for _fn in "${_only_raw[@]}"; do
    _fn="${_fn#"${_fn%%[![:space:]]*}"}"
    _fn="${_fn%"${_fn##*[![:space:]]}"}"
    [[ -z "$_fn" ]] && continue
    if [[ ! "$_fn" =~ ^[A-Za-z0-9_-]+$ ]]; then
      echo "--only: nome de function inválido: '$_fn' (use letras, números, '-' e '_')" >&2
      exit 2
    fi
    [[ " ${ONLY_FNS[*]} " == *" $_fn "* ]] && continue
    ONLY_FNS+=("$_fn")
  done
  if [[ ${#ONLY_FNS[@]} -eq 0 ]]; then
    echo "--only recebeu lista vazia — informe ao menos uma function (para o lote completo, omita --only)" >&2
    exit 2
  fi
  ONLY="$(IFS=','; echo "${ONLY_FNS[*]}")"
fi

# --- Validações -------------------------------------------------------------
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN é obrigatório (token sbp_...)}"
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF é obrigatório (ref do destino)}"

command -v supabase >/dev/null 2>&1 || { echo "supabase CLI não encontrado no PATH" >&2; exit 3; }
command -v jq >/dev/null 2>&1 || { echo "jq não encontrado no PATH" >&2; exit 3; }

[[ -d "$FUNCTIONS_DIR" ]] || { echo "Pasta $FUNCTIONS_DIR não existe" >&2; exit 4; }

if [[ $ONLY_SET -eq 1 ]]; then
  for _fn in "${ONLY_FNS[@]}"; do
    [[ -f "$FUNCTIONS_DIR/$_fn/index.ts" ]] || { echo "--only: function '$_fn' não existe em $FUNCTIONS_DIR (sem index.ts)" >&2; exit 4; }
  done
fi

DEPLOY_LOG_DIR="${DEPLOY_LOG_DIR:-/tmp}"
[[ -d "$DEPLOY_LOG_DIR" ]] || { echo "Pasta de log $DEPLOY_LOG_DIR não existe" >&2; exit 4; }
TS="$(date -u +%Y%m%d-%H%M)"
# PID no nome: duas execuções no mesmo minuto não sobrescrevem a evidência uma
# da outra. noclobber cria com O_EXCL — não segue symlink pré-plantado em /tmp.
LOG="${DEPLOY_LOG_DIR}/deploy-log-${TS}-$$.jsonl"
( set -o noclobber; : > "$LOG" ) 2>/dev/null || { echo "Não foi possível criar o log $LOG (já existe ou sem permissão)" >&2; exit 4; }

LIST_ERR=""
DEPLOY_OUT=""
trap 'rm -f "$LIST_ERR" "$DEPLOY_OUT"' EXIT

log_event() {
  # $1=event, $2=fn, $3=status, $4=extra_json (opcional)
  local extra="${4:-{\}}"
  jq -cn \
    --arg ts "$(date -u +%FT%TZ)" \
    --arg event "$1" \
    --arg fn "$2" \
    --arg status "$3" \
    --argjson extra "$extra" \
    '{ts:$ts, event:$event, fn:$fn, status:$status} + $extra' >> "$LOG"
}

echo "🔧 Destino: $SUPABASE_PROJECT_REF"
echo "📝 Log:     $LOG"
[[ $DRY_RUN -eq 1 ]] && echo "🧪 DRY-RUN ativo — nenhum deploy será executado."

# --- Verificação de secrets -------------------------------------------------
# Sem REQUIRED_SECRETS no ambiente, cai no manifest autoritativo: entries
# `supabase_vault` com required=true são os secrets que as functions exigem
# em produção. Um var ausente NÃO pode silenciar o gate do deploy em lote
# (com --only o operador escolhe o escopo e a env explícita continua valendo).
if [[ -z "${REQUIRED_SECRETS:-}" && -z "$ONLY" ]]; then
  # `SUPABASE_*` é reservado pela plataforma e nunca aparece em
  # `supabase secrets list` (ROTACAO_SECRETS.md) — excluí-lo do diff, senão
  # o gate acusaria ausência eterna e bloquearia todo deploy.
  REQUIRED_SECRETS="$(jq -r '[.vars[] | select(.dest == "supabase_vault" and .required == true) | .name | select(startswith("SUPABASE_") | not)] | join(",")' env.manifest.json 2>/dev/null)" || REQUIRED_SECRETS=""
  # Manifest ausente/inválido ou sem nenhum required não pode silenciar o
  # gate — sem a lista o deploy em lote não é autorizado.
  if [[ -z "$REQUIRED_SECRETS" ]]; then
    echo "❌ Não foi possível derivar secrets obrigatórios de env.manifest.json — o gate não pode ser pulado." >&2
    exit 5
  fi
fi
if [[ -n "${REQUIRED_SECRETS:-}" ]]; then
  echo "🔐 Verificando secrets obrigatórios no destino..."
  LIST_ERR="$(mktemp)"
  REMOTE_SECRETS="$(supabase secrets list --project-ref "$SUPABASE_PROJECT_REF" 2>"$LIST_ERR" | awk 'NR>2 {print $1}' || true)"
  # Falha do CLI (token inválido, rede, versão) sai em LIST_ERR e deixa a
  # lista vazia — sem essa contagem um vault vazio e um check quebrado são
  # indistinguíveis e todos os names saem como "faltando".
  REMOTE_COUNT="$(printf '%s\n' "$REMOTE_SECRETS" | grep -c . || true)"
  echo "   Secrets visíveis no destino: $REMOTE_COUNT"
  if [[ "$REMOTE_COUNT" -eq 0 && -s "$LIST_ERR" ]]; then
    echo "   ⚠️  'supabase secrets list' retornou erro — confira o token antes de criar secrets:" >&2
    head -3 "$LIST_ERR" >&2
  fi
  rm -f "$LIST_ERR"
  MISSING=()
  CHECKED=()
  IFS=',' read -ra WANTED <<< "$REQUIRED_SECRETS"
  for s in "${WANTED[@]}"; do
    s="$(echo "$s" | xargs)"  # trim
    [[ -z "$s" ]] && continue
    CHECKED+=("$s")
    # -F: o nome é literal — como regex, "A.B" casaria "A_B" e aprovaria o gate.
    if ! grep -Fqx -- "$s" <<< "$REMOTE_SECRETS"; then
      MISSING+=("$s")
    fi
  done
  if [[ ${#CHECKED[@]} -eq 0 ]]; then
    echo "❌ REQUIRED_SECRETS não contém nenhum nome válido: '$REQUIRED_SECRETS'" >&2
    exit 5
  fi
  if [[ ${#MISSING[@]} -gt 0 ]]; then
    log_event "secrets_check" "-" "failed" "$(jq -cn --argjson m "$(printf '%s\n' "${MISSING[@]}" | jq -R . | jq -s .)" '{missing:$m}')"
    echo "❌ Secrets faltando no destino: ${MISSING[*]}" >&2
    echo "   Configure via RUNBOOK §6 antes de rodar novamente." >&2
    exit 5
  fi
  log_event "secrets_check" "-" "ok" "$(jq -cn --argjson w "$(printf '%s\n' "${CHECKED[@]}" | jq -R . | jq -s .)" '{checked:$w}')"
  echo "✅ Todos os secrets obrigatórios estão presentes."
fi

# --- Descoberta de functions ------------------------------------------------
declare -a FNS=()
if [[ $ONLY_SET -eq 1 ]]; then
  FNS=("${ONLY_FNS[@]}")
else
  while IFS= read -r -d '' dir; do
    name="$(basename "$dir")"
    [[ "$name" == "_shared" ]] && continue
    [[ "$name" == .* ]] && continue
    [[ -f "$dir/index.ts" ]] || continue
    FNS+=("$name")
  # sort: ordem do find depende do filesystem; lote determinístico permite
  # retomar um deploy interrompido a partir do ponto exato.
  done < <(find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d -print0 | LC_ALL=C sort -z)
fi

TOTAL=${#FNS[@]}
echo "📦 ${TOTAL} function(s) alvo."
if [[ $TOTAL -eq 0 ]]; then
  echo "❌ Nenhuma function com index.ts em $FUNCTIONS_DIR — nada a implantar." >&2
  log_event "discovery" "-" "failed" '{"reason":"no_functions"}'
  exit 4
fi

# --- Helpers: validar cobertura do config.toml -----------------------------
config_functions() {
  awk '
    /^\[functions\.[^]]+\]$/ {
      line = $0
      sub(/^\[functions\./, "", line)
      sub(/\]$/, "", line)
      print line
    }
  ' "$CONFIG_TOML" | sort -u
}

verify_jwt_for() {
  local fn="$1"
  # Bloco: [functions.<fn>]   ... verify_jwt = true|false
  awk -v fn="$fn" '
    $0 == "[functions." fn "]" { inblock=1; next }
    /^\[/ { inblock=0 }
    inblock && /^[[:space:]]*verify_jwt[[:space:]]*=/ {
      sub(/#.*/, "");
      gsub(/[[:space:]]|verify_jwt|=/, "");
      print; exit
    }
  ' "$CONFIG_TOML" 2>/dev/null
}

validate_config_coverage() {
  local tmp_expected tmp_config missing unexpected
  tmp_expected="$(mktemp)"
  tmp_config="$(mktemp)"

  printf '%s\n' "${FNS[@]}" | sort -u > "$tmp_expected"
  config_functions > "$tmp_config"

  missing="$(comm -23 "$tmp_expected" "$tmp_config" || true)"
  unexpected="$(comm -13 "$tmp_expected" "$tmp_config" || true)"

  if [[ -n "$missing" ]]; then
    echo "❌ ${CONFIG_TOML} sem blocos [functions.<nome>] para:" >&2
    printf '%s\n' "$missing" >&2
    log_event "config_coverage" "-" "failed" \
      "$(jq -cn --argjson missing "$(printf '%s\n' "$missing" | jq -R . | jq -s .)" '{missing:$missing}')"
    rm -f "$tmp_expected" "$tmp_config"
    exit 6
  fi

  # Com --only, todo o resto do config.toml está "fora do lote" por definição.
  if [[ -n "$unexpected" && $ONLY_SET -eq 0 ]]; then
    echo "⚠️ ${CONFIG_TOML} possui funções fora do lote alvo:" >&2
    printf '%s\n' "$unexpected" >&2
    log_event "config_coverage" "-" "warning" \
      "$(jq -cn --argjson extra "$(printf '%s\n' "$unexpected" | jq -R . | jq -s .)" '{extra:$extra}')"
  else
    log_event "config_coverage" "-" "ok" \
      "$(jq -cn --argjson total "$TOTAL" '{functions:$total}')"
  fi

  rm -f "$tmp_expected" "$tmp_config"
}

validate_config_coverage

STOPPED=0
stop_if_needed() {
  if [[ "${STOP_ON_FAIL:-0}" == "1" ]]; then
    echo "⛔ STOP_ON_FAIL=1 — lote interrompido." >&2
    STOPPED=1
    return 0
  fi
  return 1
}

# --- Loop de deploy ---------------------------------------------------------
OK=0; FAIL=0; TENTADAS=0
[[ $DRY_RUN -eq 1 ]] || DEPLOY_OUT="$(mktemp)"
for fn in "${FNS[@]}"; do
  TENTADAS=$((TENTADAS + 1))
  vjwt="$(verify_jwt_for "$fn")"
  DEPLOY_ARGS=()
  # Segurança fail-closed: toda função precisa declarar explicitamente a política
  # de JWT. Sem isso, um deploy em massa poderia tornar pública uma função que o
  # ambiente remoto atualmente protege na borda.
  if [[ -z "$vjwt" ]]; then
    echo "❌ ${fn}: verify_jwt ausente em ${CONFIG_TOML}; deploy recusado." >&2
    FAIL=$((FAIL + 1))
    log_event "deploy" "$fn" "failed" '{"reason":"verify_jwt_missing"}'
    stop_if_needed && break
    continue
  elif [[ "$vjwt" == "true" ]]; then
    # A CLI atual protege por JWT por padrão e não aceita mais --verify-jwt.
    FLAG="jwt-padrao"
  elif [[ "$vjwt" == "false" ]]; then
    FLAG="--no-verify-jwt"
    DEPLOY_ARGS=("$FLAG")
  else
    echo "❌ ${fn}: verify_jwt inválido em ${CONFIG_TOML}: ${vjwt}" >&2
    FAIL=$((FAIL + 1))
    log_event "deploy" "$fn" "failed" '{"reason":"verify_jwt_invalid"}'
    stop_if_needed && break
    continue
  fi

  echo "→ deploy ${fn} (${FLAG})"
  if [[ $DRY_RUN -eq 1 ]]; then
    log_event "deploy" "$fn" "dry-run" "$(jq -cn --arg f "$FLAG" '{flag:$f}')"
    continue
  fi

  if supabase functions deploy "$fn" \
      --project-ref "$SUPABASE_PROJECT_REF" \
      "${DEPLOY_ARGS[@]}" \
      >"$DEPLOY_OUT" 2>&1; then
    OK=$((OK+1))
    log_event "deploy" "$fn" "ok" "$(jq -cn --arg f "$FLAG" '{flag:$f}')"
  else
    FAIL=$((FAIL+1))
    # O log vira artifact do workflow (não é mascarado como o console): o
    # token nunca pode ir junto com a saída da CLI.
    ERR_TXT="$(tail -c 1000 "$DEPLOY_OUT")"
    ERR="$(printf '%s' "${ERR_TXT//"$SUPABASE_ACCESS_TOKEN"/***}" | jq -Rs .)"
    log_event "deploy" "$fn" "failed" "$(jq -cn --argjson e "$ERR" --arg f "$FLAG" '{flag:$f, error:$e}')"
    echo "   ❌ falhou — ver $LOG" >&2
    # Falha no meio do lote deixa prod com versões mistas; parar aqui mantém
    # o estrago mínimo e o log diz onde retomar com --only fn1,fn2,...
    stop_if_needed && break
  fi
done

if [[ $STOPPED -eq 1 ]]; then
  PENDENTES=("${FNS[@]:$TENTADAS}")
  if [[ ${#PENDENTES[@]} -gt 0 ]]; then
    PEND_CSV="$(IFS=','; echo "${PENDENTES[*]}")"
    echo "   Não tentadas (${#PENDENTES[@]}): retome com --only $PEND_CSV" >&2
    log_event "stopped" "-" "pending" "$(jq -cn --arg p "$PEND_CSV" '{pending:($p | split(","))}')"
  fi
fi

# --- Resumo -----------------------------------------------------------------
echo ""
echo "==================== RESUMO ===================="
echo "Total:   $TOTAL"
echo "OK:      $OK"
echo "Falhas:  $FAIL"
echo "Dry-run: $([[ $DRY_RUN -eq 1 ]] && echo sim || echo não)"
echo "Log:     $LOG"
echo "================================================"

log_event "summary" "-" "done" "$(jq -cn --argjson t $TOTAL --argjson o $OK --argjson f $FAIL '{total:$t, ok:$o, failed:$f}')"

[[ $FAIL -eq 0 ]]
