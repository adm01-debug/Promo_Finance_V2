"""Inventário estático de Edge Functions Deno; não inicia handlers nem acessa a rede."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import tempfile
from datetime import datetime, timezone

from run import ROOT, SECRET, atomic_write_json, command
from typescript_imports import extract_imports


GUARD_PATTERNS = {
    "usuario": re.compile(r"\b(?:exigirUsuario|getUser|getClaims)\s*\("),
    "papel": re.compile(r"\bexigirPapel\s*\("),
    "interna": re.compile(r"\bexigirChamadaInterna\s*\("),
    "webhook": re.compile(r"\b(?:authenticateWebhook|verifyWebhookSignature)\s*\("),
}
ENTRYPOINT = re.compile(r"\b(?:Deno\.serve|serve)\s*\(")
SERVICE_ROLE = re.compile(r"\bSUPABASE_SERVICE_ROLE_KEY\b")


def edge_files(root=ROOT):
    tracked = set(command(["git", "ls-files", "-z"], root).split("\0"))
    prefix = "supabase/functions/"
    return sorted(name for name in tracked
                  if name.startswith(prefix) and name.endswith("/index.ts")
                  and name.count("/") == 3)


def inspect_edge(relative, text):
    imports = extract_imports(relative, text)
    return {
        "name": Path(relative).parent.name,
        "entrypoint": bool(ENTRYPOINT.search(text)),
        "imports": len(imports),
        "external_imports": sorted({item["specifier"] for item in imports
                                    if item["specifier"].startswith(("http://", "https://", "jsr:", "npm:"))}),
        "shared_imports": sorted({item["specifier"] for item in imports if "_shared" in item["specifier"]}),
        "guard_signals": sorted(name for name, pattern in GUARD_PATTERNS.items() if pattern.search(text)),
        "uses_service_role": bool(SERVICE_ROLE.search(text)),
        "confidence": "SINAL_ESTATICO",
    }


def inventory(root=ROOT):
    functions, hashes, credential_like = [], {}, []
    for relative in edge_files(root):
        content = (root / relative).read_bytes()
        text = content.decode("utf-8")
        if "\0" in text:
            raise ValueError(f"Edge Function binária inesperada: {relative}")
        if SECRET.search(text):
            credential_like.append(relative)
        hashes[relative] = hashlib.sha256(content).hexdigest()
        functions.append(inspect_edge(relative, text))
    if not functions:
        raise ValueError("Nenhuma Edge Function rastreada foi encontrada.")
    return {"functions": functions, "hashes": hashes, "credential_like_files": credential_like}


def persist_evidence(run, evidence):
    atomic_write_json(run / "evidencia.json", evidence)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-root", type=Path, default=ROOT / "graphify-out" / "edge-inventory")
    args = parser.parse_args()
    if args.output_root.is_symlink():
        parser.exit(1, "Diretório de saída não pode ser link simbólico.\n")
    args.output_root.mkdir(parents=True, exist_ok=True)
    run = Path(tempfile.mkdtemp(prefix="execucao-", dir=args.output_root))
    run.chmod(0o700)
    evidence = {
        "status": "iniciado",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "Inventário estático Deno/Edge; sem execução e sem rede",
    }
    persist_evidence(run, evidence)
    try:
        evidence["commit"] = command(["git", "rev-parse", "HEAD"], ROOT).strip()
        result = inventory()
        functions = result["functions"]
        summary = {
            "functions": len(functions),
            "entrypoints_detected": sum(item["entrypoint"] for item in functions),
            "with_guard_signal": sum(bool(item["guard_signals"]) for item in functions),
            "with_service_role": sum(item["uses_service_role"] for item in functions),
            "with_external_import": sum(bool(item["external_imports"]) for item in functions),
        }
        evidence.update({
            "status": "validado_com_limitacoes",
            "summary": summary,
            "hashes": result["hashes"],
            "credential_like_files": result["credential_like_files"],
            "limitations": [
                "Sinal de guard não prova que toda rota está protegida nem que o guard antecede efeitos colaterais.",
                "Ausência de sinal não prova exposição: gateway, segredo customizado ou proxy podem proteger a função.",
                "Inventário local não comprova igualdade de bytes com o bundle implantado.",
            ],
        })
        (run / "edge-functions.json").write_text(json.dumps({
            "summary": summary, "functions": functions
        }, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps(summary, ensure_ascii=False))
        print(f"Inventário Edge: {run / 'edge-functions.json'}")
    except Exception:
        evidence["status"] = "falhou"
        raise
    finally:
        persist_evidence(run, evidence)


if __name__ == "__main__":
    main()
