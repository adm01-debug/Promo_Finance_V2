#!/usr/bin/env bash
# mesclar-prontos.sh — gerado em 29/10/2026 pelo Claude. NÃO roda sozinho: o Joaquim executa.
# Mescla um PR por vez, na ordem. Para no primeiro que não estiver aberto, mergeável,
# sem bloqueio e com todos os checks obrigatórios verdes. Rode de novo depois de
# resolver o motivo da parada (ex.: esperar o CI após update-branch).
set -euo pipefail

pronto() {
  local repo=$1 n=$2 st state mg ms
  st=$(gh pr view "$n" -R "$repo" --json state,mergeable,mergeStateStatus \
        --jq '"\(.state) \(.mergeable) \(.mergeStateStatus)"')
  read -r state mg ms <<<"$st"
  if [[ $state == MERGED ]]; then echo "já mesclado: $repo#$n"; return 2; fi
  if [[ $state == OPEN && $mg == MERGEABLE && $ms == BEHIND ]]; then
    echo "PARADO: $repo#$n atrás da main — rodando update-branch; rode de novo quando o CI terminar."
    gh pr update-branch "$n" -R "$repo"; exit 1
  fi
  if ! [[ $state == OPEN && $mg == MERGEABLE && $ms =~ ^(CLEAN|UNSTABLE|HAS_HOOKS)$ ]]; then
    echo "PARADO: $repo#$n não está pronto ($st)"; exit 1
  fi
  if ! gh pr checks "$n" -R "$repo" --required >/dev/null 2>&1; then
    echo "PARADO: $repo#$n — checks obrigatórios não estão todos verdes"; exit 1
  fi
}

mesclar() {
  local repo=$1 n=$2 rc=0
  pronto "$repo" "$n" || rc=$?
  [[ $rc == 2 ]] && return 0
  gh pr merge "$n" -R "$repo" --squash
  echo "OK: $repo#$n mesclado"
}

mesclar adm01-debug/Promo_Finance_V2 198
mesclar adm01-debug/Promo_Finance_V2 199
