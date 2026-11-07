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
#   POST_DEPLOY_CHECK=0                                     # desliga a verificação pós-deploy (default ligada)
#   EDGE_SMOKE=0                                            # desliga o edge smoke (default ligado)
#   EDGE_SMOKE_BASE_URL=https://<ref>.supabase.co/functions/v1  # override da base p/ smoke
#   HEALTH_CHECK_WAIT=1                                     # aguarda 5 min antes do health check
#
# Saída: /tmp/deploy-log-YYYYMMDD-HHMM.jsonl (redigido; sem credenciais)
#        /tmp/verify-remote-$$.json e /tmp/edge-smoke-$$.json (atestações)

set -euo pipefail

DRY_RUN=0
ONLY=""
POST_DEPLOY_CHECK="${POST_DEPLOY_CHECK:-1}"
EDGE_SMOKE="${EDGE_SMOKE:-1}"
HEALTH_CHECK_WAIT="${HEALTH_CHECK_WAIT:-0}"
FUNCTIONS_DIR="${FUNCTIONS_DIR:-supabase/functions}"
CONFIG_TOML="supabase/config.toml"
EDGE_DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)/edge-deploy"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --only) ONLY="$2"; shift 2 ;;
    --no-post-deploy-check) POST_DEPLOY_CHECK=0; shift ;;
    --no-smoke) EDGE_SMOKE=0; shift ;;
    -h|--help)
      sed -n '2,28p' "$0"; exit 0 ;;
    *) echo "Argumento desconhecido: $1" >&2; exit 2 ;;
  esac
done

# --- Validações -------------------------------------------------------------
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN é obrigatório (token sbp_...)}"
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF é obrigatório (ref do destino)}"

command -v supabase >/dev/null 2>&1 || { echo "supabase CLI não encontrado no PATH" >&2; exit 3; }
command -v jq >/dev/null 2>&1 || { echo "jq não encontrado no PATH" >&2; exit 3; }

[[ -d "$FUNCTIONS_DIR" ]] || { echo "Pasta $FUNCTIONS_DIR não existe" >&2; exit 4; }

TS="$(date -u +%Y%m%d-%H%M)"
LOG="/tmp/deploy-log-${TS}.jsonl"
: > "$LOG"

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
  IFS=',' read -ra WANTED <<< "$REQUIRED_SECRETS"
  for s in "${WANTED[@]}"; do
    s="$(echo "$s" | xargs)"  # trim
    [[ -z "$s" ]] && continue
    if ! grep -qx "$s" <<< "$REMOTE_SECRETS"; then
      MISSING+=("$s")
    fi
  done
  if [[ ${#MISSING[@]} -gt 0 ]]; then
    log_event "secrets_check" "-" "failed" "$(jq -cn --argjson m "$(printf '%s\n' "${MISSING[@]}" | jq -R . | jq -s .)" '{missing:$m}')"
    echo "❌ Secrets faltando no destino: ${MISSING[*]}" >&2
    echo "   Configure via RUNBOOK §6 antes de rodar novamente." >&2
    exit 5
  fi
  log_event "secrets_check" "-" "ok" "$(jq -cn --argjson w "$(printf '%s\n' "${WANTED[@]}" | jq -R . | jq -s .)" '{checked:$w}')"
  echo "✅ Todos os secrets obrigatórios estão presentes."
fi

# --- Descoberta de functions ------------------------------------------------
declare -a FNS=()
if [[ -n "$ONLY" ]]; then
  IFS=',' read -ra FNS <<< "$ONLY"
else
  while IFS= read -r -d '' dir; do
    name="$(basename "$dir")"
    [[ "$name" == "_shared" ]] && continue
    [[ "$name" == .* ]] && continue
    [[ -f "$dir/index.ts" ]] || continue
    FNS+=("$name")
  done < <(find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d -print0)
fi

TOTAL=${#FNS[@]}
echo "📦 ${TOTAL} function(s) alvo."

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
    $0 ~ "^\\[functions\\."fn"\\]" { inblock=1; next }
    /^\[/ { inblock=0 }
    inblock && /^[[:space:]]*verify_jwt[[:space:]]*=/ {
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

  if [[ -n "$unexpected" ]]; then
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

stop_if_needed() {
  if [[ "${STOP_ON_FAIL:-0}" == "1" ]]; then
    echo "⛔ STOP_ON_FAIL=1 — lote interrompido." >&2
    return 0
  fi
  return 1
}

# --- Loop de deploy ---------------------------------------------------------
OK=0; FAIL=0
for fn in "${FNS[@]}"; do
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
      >/tmp/deploy-out-$$.log 2>&1; then
    OK=$((OK+1))
    log_event "deploy" "$fn" "ok" "$(jq -cn --arg f "$FLAG" '{flag:$f}')"
  else
    FAIL=$((FAIL+1))
    ERR="$(tail -c 1000 /tmp/deploy-out-$$.log | jq -Rs .)"
    log_event "deploy" "$fn" "failed" "$(jq -cn --argjson e "$ERR" --arg f "$FLAG" '{flag:$f, error:$e}')"
    echo "   ❌ falhou — ver $LOG" >&2
    # Falha no meio do lote deixa prod com versões mistas; parar aqui mantém
    # o estrago mínimo e o log diz onde retomar com --only fn1,fn2,...
    if stop_if_needed; then
      rm -f /tmp/deploy-out-$$.log
      break
    fi
  fi
  rm -f /tmp/deploy-out-$$.log
done

# --- Verificação pós-deploy (aditiva; não altera a ordem do deploy) --------
# Liga por padrão; desliga com POST_DEPLOY_CHECK=0 / --no-post-deploy-check.
# Cada etapa degrada sozinha (::warning::) — nenhuma delas derruba o deploy:
# a falha de pós-verificação FICA registrada no log e no resumo, mas o pipeline
# continua, mantendo o comportamento histórico do `[[ $FAIL -eq 0 ]]`.
if [[ $DRY_RUN -eq 0 && $POST_DEPLOY_CHECK -eq 1 && $FAIL -eq 0 ]]; then
  echo ""
  echo "==================== PÓS-DEPLOY ===================="
  smokecheck=0; hcheck=0; vcheck=0

  # 1. Edge smoke: OPTIONS/POST anônimo contra o gateway — prova real de
  #    disponibilidade e CORS, sem depender de credencial extra.
  if [[ $EDGE_SMOKE -eq 1 && -n "${EDGE_SMOKE_BASE_URL:-}" ]]; then
    SMOKE_LIST="/tmp/functions-list-$$.json"
    # Lista plana contendo name + verify_jwt, extraída do config.toml (mesma
    # política fail-closed do loop de deploy).
    jq -n --argjson fns "$(for fn in "${FNS[@]}"; do
      vj="$(verify_jwt_for "$fn")"
      if [[ -z "$vj" || ( "$vj" != "true" && "$vj" != "false" ) ]]; then
        echo "{\"name\":\"$fn\",\"verify_jwt\":true}"  # conservador p/ smoke
      else
        echo "{\"name\":\"$fn\",\"verify_jwt\":$( [[ "$vj" == "true" ]] && echo true || echo false )}"
      fi
    done | jq -s .)" '{functions: ($fns)}' > "$SMOKE_LIST"
    if node "$EDGE_DEPLOY_DIR/smoke-functions.mjs" \
        --base-url "$EDGE_SMOKE_BASE_URL" \
        --config-toml "$CONFIG_TOML" \
        --functions-list "$SMOKE_LIST" \
        --git-sha "${GITHUB_SHA:-local}" \
        --run-id "${GITHUB_RUN_ID:-0}" \
        --output "/tmp/edge-smoke-$$.json" \
        --retries 2 2>&1 | sed 's/^/   [smoke] /'; then
      smokecheck=1
    else
      echo "   ⚠️  edge smoke com falhas — ver /tmp/edge-smoke-$$.json" >&2
    fi
    rm -f "$SMOKE_LIST"
  fi

  # 2. Health check (Management API). Degrada para ::warning:: se a
  #    observabilidade estiver indisponível; só vira ::error:: com 5xx alto.
  if command -v node >/dev/null 2>&1; then
    HEALTH_ARGS=(--project-ref "$SUPABASE_PROJECT_REF" --no-wait)
    [[ $HEALTH_CHECK_WAIT -eq 1 ]] && HEALTH_ARGS=(--project-ref "$SUPABASE_PROJECT_REF")
    if node "$EDGE_DEPLOY_DIR/health-check.mjs" "${HEALTH_ARGS[@]}" 2>&1 | sed 's/^/   [health] /'; then
      hcheck=1
    else
      echo "   ⚠️  health-check com falhas — ver resumo" >&2
    fi
  fi

  # 3. Verify-remote: inventário `supabase functions list --output json`
  #    (READ-ONLY; jamais usado para escrever) contra a lista alvo.
  if command -v jq >/dev/null 2>&1; then
    REMOTE_LIST="/tmp/remote-functions-$$.json"
    if supabase functions list --project-ref "$SUPABASE_PROJECT_REF" --output json > "$REMOTE_LIST" 2>/dev/null; then
      EXPECTED="/tmp/expected-functions-$$.json"
      printf '%s\n' "${FNS[@]}" | jq -R . | jq -s '{functions: map({name: .})}' > "$EXPECTED"
      OUTPUT="/tmp/verify-remote-$$.json"
      if node "$EDGE_DEPLOY_DIR/verify-remote.mjs" \
          --expected "$EXPECTED" \
          --remote "$REMOTE_LIST" \
          --git-sha "${GITHUB_SHA:-local}" \
          --run-id "${GITHUB_RUN_ID:-0}" \
          --output "$OUTPUT" 2>&1 | sed 's/^/   [remote] /'; then
        vcheck=1
      else
        echo "   ⚠️  verify-remote reportou funções ausentes do remoto — ver $OUTPUT" >&2
      fi
      rm -f "$EXPECTED" "$OUTPUT"
    else
      echo "   ⚠️  'supabase functions list' falhou — verify-remote ignorado" >&2
    fi
    rm -f "$REMOTE_LIST"
  fi

  echo "   Pós-deploy: smoke=$smokecheck health=$hcheck remote=$vcheck"
  log_event "post_deploy_check" "-" "done" \
    "$(jq -cn --argjson s "$smokecheck" --argjson h "$hcheck" --argjson r "$vcheck" \
      '{smoke:$s, health:$h, remote:$r, redacted:true}')"
fi

  # --- Redação final do log (sempre; nunca credencial no artifact) ------------
  # O JSONL ($LOG) é o único registro que vai ao artifact; o stdout do deploy é
  # efêmero (o loop remove /tmp/deploy-out-$$.log a cada iteração). O log_event
  # acima exporta `error` com tail do stdout — redigir garante que nada disso
  # carregue `access_token`. REDIGIR_LOG_BASE=dirname obriga o confinamento do
  # redigir-log.mjs a aceitar /tmp: fora do CI a base padrão é o cwd e um
  # caminho absoluto seria rejeitado. Em dry-run o log existe desde a linha TS
  # (sem eventos) — a redação é idempotente.
  if [[ -f "$LOG" ]]; then
    REDIGIR_LOG_BASE="$(dirname "$LOG")" node "$EDGE_DEPLOY_DIR/redigir-log.mjs" "$LOG" \
        --segredo-env=SUPABASE_ACCESS_TOKEN >/dev/null 2>&1 \
      && echo "🔒 Log de deploy redigido (nada de credenciais no artifact)." \
      || echo "   ⚠️  Redação do log não aplicada — confira o artifact." >&2
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
