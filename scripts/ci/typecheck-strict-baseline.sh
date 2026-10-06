#!/usr/bin/env bash
# Ratchet de strictNullChecks — "o baseline só encolhe".
#
# O tsconfig principal já roda strict global (PR #141). Este gate roda
# tsc com --strictNullChecks e compara as assinaturas de erro com o baseline
# versionado em baselines/strictnullchecks-baseline.txt:
#
#   - erro NOVO (não está no baseline) → falha a PR;
#   - erro que sumiu → ok (o baseline encolheu naturalmente);
#   - igualdade → ok.
#
# Assinatura = caminho + código TS + mensagem, sem linha/coluna — mover código
# dentro do arquivo não quebra o gate, mas inserir a MESMA linha de erro num
# arquivo novo é detectada só se a assinatura for inédita (limitação aceita,
# documentada no audit da trilha).
#
# Regenerar baseline (só quando intencional):
#   scripts/ci/typecheck-strict-baseline.sh --update
set -euo pipefail

cd "$(dirname "$0")/../.."
BASELINE="scripts/ci/baselines/strictnullchecks-baseline.txt"

atualizar() {
  # tsc sai com código 2 quando há erros — é o esperado, não uma falha do gate.
  set +e
  SAIDA="$(node node_modules/typescript/bin/tsc --noEmit --strictNullChecks -p tsconfig.json 2>&1)"
  RC=$?
  set -e
  # grep sai 1 sem matches — com pipefail isso mataria o script num build
  # limpo (zero erros), então o '|| true' fica dentro da subshell.
  ERROS="$(printf '%s\n' "$SAIDA" | { grep 'error TS' || true; } | sed -E 's/\([0-9]+,[0-9]+\)/(...)/' | sort -u)"
  # Sem linhas "error TS" mas com falha = crash do compilador (OOM, config
  # inválida) — não pode virar "baseline vazia" nem passar o gate de graça.
  if [[ $RC -ne 0 && -z "$ERROS" ]]; then
    echo "::error::tsc falhou sem emitir 'error TS' (exit $RC) — saída:" >&2
    printf '%s\n' "$SAIDA" >&2
    return 1
  fi
  [[ -z "$ERROS" ]] || printf '%s\n' "$ERROS"
}

if [[ "${1:-}" = "--update" ]]; then
  atualizar > "$BASELINE"
  echo "Baseline regerado: $(wc -l < "$BASELINE") assinaturas"
  exit 0
fi

[[ -f "$BASELINE" ]] || { echo "::error::Baseline ausente em $BASELINE"; exit 1; }

ATUAL="$(mktemp)"
NOVOS="$(mktemp)"
trap 'rm -f "$ATUAL" "$NOVOS"' EXIT

atualizar > "$ATUAL"
TOTAL_ATUAL=$(wc -l < "$ATUAL")
TOTAL_BASELINE=$(wc -l < "$BASELINE")

comm -23 "$ATUAL" "$BASELINE" > "$NOVOS"
NOVOS_COUNT=$(wc -l < "$NOVOS")

echo "strictNullChecks: $TOTAL_ATUAL erros atuais vs $TOTAL_BASELINE no baseline"

if [[ "$TOTAL_ATUAL" -lt "$TOTAL_BASELINE" ]]; then
  echo "::notice::Baseline encolheu $(( TOTAL_BASELINE - TOTAL_ATUAL )) erros — considere regenerar com --update"
fi

if [[ "$NOVOS_COUNT" -gt 0 ]]; then
  echo "::error::$NOVOS_COUNT erro(s) novo(s) de strictNullChecks:"
  cat "$NOVOS"
  exit 1
fi

echo "✅ Nenhum erro novo de strictNullChecks."
