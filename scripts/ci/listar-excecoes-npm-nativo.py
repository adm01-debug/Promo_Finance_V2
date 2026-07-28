#!/usr/bin/env python3
"""
Lista os arquivos .ts de supabase/functions que devem ser pulados no
`deno check` porque dependem (direta ou transitivamente) de pacotes npm
nativos que o type-checker não resolve sem `node_modules` instalado.

Antes essa lista era um regex fixo com dois nomes de função. Isso quebrava
silenciosamente sempre que um módulo compartilhado passava a importar o
pacote nativo — foi exatamente o que aconteceu com `_shared/sefaz/pfx.ts`.
Aqui a lista é derivada do grafo real de imports, então não envelhece.

Saída: um caminho por linha, relativo à raiz do repositório.
"""
from __future__ import annotations

import os
import re
import sys

RAIZ = "supabase/functions"

# Pacotes npm com binding nativo / sem tipos resolvíveis offline.
PACOTES_NATIVOS = ("node-forge",)

IMPORT_RE = re.compile(
    r"""(?:from|import)\s*\(?\s*['"]([^'"]+)['"]""",
    re.MULTILINE,
)


def arquivos_ts() -> list[str]:
    saida: list[str] = []
    for base, _dirs, nomes in os.walk(RAIZ):
        for nome in nomes:
            if nome.endswith(".ts"):
                saida.append(os.path.join(base, nome))
    return sorted(saida)


def main() -> int:
    if not os.path.isdir(RAIZ):
        print(f"diretório {RAIZ} não encontrado", file=sys.stderr)
        return 1

    todos = arquivos_ts()
    conteudo: dict[str, str] = {}
    # Mapa: arquivo -> conjunto de arquivos locais que ele importa.
    deps: dict[str, set[str]] = {}
    contaminados: set[str] = set()

    for caminho in todos:
        try:
            texto = open(caminho, encoding="utf-8").read()
        except OSError:
            continue
        conteudo[caminho] = texto

        if any(pkg in texto for pkg in PACOTES_NATIVOS):
            contaminados.add(caminho)

        locais: set[str] = set()
        for spec in IMPORT_RE.findall(texto):
            if not spec.startswith("."):
                continue
            alvo = os.path.normpath(os.path.join(os.path.dirname(caminho), spec))
            if not alvo.endswith(".ts"):
                alvo += ".ts"
            if os.path.isfile(alvo):
                locais.add(alvo)
        deps[caminho] = locais

    # Fecho transitivo: quem importa contaminado também é contaminado.
    mudou = True
    while mudou:
        mudou = False
        for caminho, locais in deps.items():
            if caminho in contaminados:
                continue
            if locais & contaminados:
                contaminados.add(caminho)
                mudou = True

    for caminho in sorted(contaminados):
        print(caminho)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
