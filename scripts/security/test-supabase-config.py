#!/usr/bin/env python3
"""Valida a sintaxe e contratos críticos do supabase/config.toml.

Exit 0 = íntegro; 1 = TOML inválido ou contrato violado.
Testes: python3 scripts/security/test_gates_shell.py
"""

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
    if not isinstance(functions, dict):
        print(f"Falha: 'functions' em {CONFIG} não é uma tabela TOML.", file=sys.stderr)
        return 1

    failures: list[str] = []
    # O deploy (scripts/migrate-functions.sh) recusa a função cujo verify_jwt não
    # seja literalmente true/false; pegar aqui evita descobrir só na hora do deploy.
    for name, block in functions.items():
        value = block.get("verify_jwt") if isinstance(block, dict) else None
        if not isinstance(value, bool):
            failures.append(
                f"functions.{name}.verify_jwt deve ser booleano (true/false); encontrado {value!r}"
            )

    for name in INTERNAL_AUTH_FUNCTIONS:
        block = functions.get(name, {})
        value = block.get("verify_jwt") if isinstance(block, dict) else None
        if value is not False:
            failures.append(
                f"functions.{name}.verify_jwt deve ser false; encontrado {value!r}"
            )

    if failures:
        print("Falha: contratos de autenticação interna inválidos:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1

    # Não bloqueia: sem bloco a plataforma exige JWT (default seguro), mas o deploy
    # em lote aborta (exit 6) enquanto houver função em disco sem bloco.
    functions_dir = ROOT / "supabase" / "functions"
    sem_bloco = sorted(
        index.parent.name
        for index in functions_dir.glob("*/index.ts")
        if index.parent.name != "_shared"
        and not index.parent.name.startswith(".")
        and index.parent.name not in functions
    )
    if sem_bloco:
        print(
            f"Aviso: {len(sem_bloco)} função(ões) em disco sem bloco [functions.<nome>] "
            f"em config.toml: {', '.join(sem_bloco)}",
            file=sys.stderr,
        )

    print("OK: config.toml válido e contratos de autenticação interna preservados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
