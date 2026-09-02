#!/usr/bin/env bash
set -euo pipefail

label=""
mode="fail"
output_name=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --label)
      if [ "$#" -lt 2 ]; then
        echo "::error::--label exige um valor."
        exit 2
      fi
      label="$2"
      shift 2
      ;;
    --mode)
      if [ "$#" -lt 2 ]; then
        echo "::error::--mode exige um valor."
        exit 2
      fi
      mode="$2"
      shift 2
      ;;
    --output)
      if [ "$#" -lt 2 ]; then
        echo "::error::--output exige um valor."
        exit 2
      fi
      output_name="$2"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    *)
      break
      ;;
  esac
done

if [ -z "$label" ]; then
  echo "::error::scripts/ci/require-env.sh exige --label."
  exit 2
fi

if [ "$mode" != "fail" ] && [ "$mode" != "summary" ]; then
  echo "::error::--mode deve ser 'fail' ou 'summary'."
  exit 2
fi

if [ -n "$output_name" ] && ! [[ "$output_name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "::error::--output deve ser um nome de output válido."
  exit 2
fi

if [ "$#" -eq 0 ]; then
  echo "::error::scripts/ci/require-env.sh exige ao menos uma variável."
  exit 2
fi

missing=()
for key in "$@"; do
  if ! [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    echo "::error::Nome de variável inválido: ${key}."
    exit 2
  fi

  value="${!key:-}"
  if [ -z "${value//[[:space:]]/}" ]; then
    missing+=("$key")
  fi
done

if [ -n "$output_name" ] && [ -n "${GITHUB_OUTPUT:-}" ]; then
  if [ "${#missing[@]}" -eq 0 ]; then
    echo "${output_name}=true" >> "$GITHUB_OUTPUT"
  else
    echo "${output_name}=false" >> "$GITHUB_OUTPUT"
  fi
fi

if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### ${label}"
    if [ "${#missing[@]}" -eq 0 ]; then
      echo
      echo "- Status: pronto"
      echo "- Variáveis verificadas: \`$*\`"
    else
      echo
      echo "- Status: pendência de configuração"
      echo "- Variáveis ausentes: \`${missing[*]}\`"
    fi
    echo
  } >> "$GITHUB_STEP_SUMMARY"
fi

if [ "${#missing[@]}" -eq 0 ]; then
  echo "✓ ${label}: todas as variáveis obrigatórias estão presentes."
  exit 0
fi

for key in "${missing[@]}"; do
  if [ "$mode" = "fail" ]; then
    echo "::error::${label}: variável obrigatória ausente (${key})."
  else
    echo "::warning::${label}: variável ausente (${key})."
  fi
done

if [ "$mode" = "fail" ]; then
  exit 1
fi
