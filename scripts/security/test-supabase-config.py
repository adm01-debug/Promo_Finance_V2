#!/usr/bin/env python3
"""Valida a sintaxe e contratos críticos do supabase/config.toml."""

from pathlib import Path
import sys
import tomllib


ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "supabase" / "config.toml"
INTERNAL_AUTH_FUNCTIONS = (
    "ci-security-gate-log",
    "n8n-callback",
    "notify-performance-alert",
)


def main() -> int:
    try:
        with CONFIG.open("rb") as config_file:
            config = tomllib.load(config_file)
    except (OSError, tomllib.TOMLDecodeError) as error:
        print(f"Falha: {CONFIG} não é um TOML válido: {error}", file=sys.stderr)
        return 1

    functions = config.get("functions", {})
    failures: list[str] = []
    for name in INTERNAL_AUTH_FUNCTIONS:
        value = functions.get(name, {}).get("verify_jwt")
        if value is not False:
            failures.append(
                f"functions.{name}.verify_jwt deve ser false; encontrado {value!r}"
            )

    if failures:
        print("Falha: contratos de autenticação interna inválidos:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    print("OK: config.toml válido e contratos de autenticação interna preservados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
