"""Correlaciona referências literais TypeScript com migrations e Edge Functions.

Somente leitura estática: ausência de correspondência não prova erro ou objeto morto.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import tempfile
from datetime import datetime, timezone

from run import ROOT, SECRET, atomic_write_json, command, is_allowed_path
from sql_inventory import inventory as migration_inventory
from typescript_imports import extract_imports, resolve_imports


PATTERNS = {
    "relation": re.compile(r"\.from\(\s*(['\"])([A-Za-z_][A-Za-z0-9_]*)\1\s*\)"),
    "rpc": re.compile(r"\.rpc\(\s*(['\"])([A-Za-z_][A-Za-z0-9_]*)\1\s*[,)]"),
    "edge_function": re.compile(r"\.functions\.invoke\(\s*(['\"])([A-Za-z0-9_-]+)\1\s*[,)]"),
    "route": re.compile(r"(?:path\s*[=:]|navigate\()\s*(['\"])(/[^'\"]*)\1"),
    "query_key": re.compile(r"\bqueryKey\s*:\s*\[\s*(['\"])([^'\"]+)\1"),
    "mutation_key": re.compile(r"\bmutationKey\s*:\s*\[\s*(['\"])([^'\"]+)\1"),
}
DYNAMIC_PATTERNS = {
    "relation": re.compile(r"\.from\(\s*(?!['\"])[^)]+\)"),
    "rpc": re.compile(r"\.rpc\(\s*(?!['\"])[^)]+\)"),
    "edge_function": re.compile(r"\.functions\.invoke\(\s*(?!['\"])[^)]+\)"),
    "query_key": re.compile(r"\bqueryKey\s*:(?!\s*\[)\s*[^,}\n]+"),
    "mutation_key": re.compile(r"\bmutationKey\s*:(?!\s*\[)\s*[^,}\n]+"),
}
KEY_ARRAY = re.compile(r"\b(queryKey|mutationKey)\s*:\s*\[([^\]]*)\]", re.DOTALL)
STATIC_KEY_TOKEN = re.compile(
    r"(?:'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|-?\d+(?:\.\d+)?|\b(?:true|false|null)\b)"
)


def source_files(root=ROOT):
    tracked = command(["git", "ls-files", "-z"], root).split("\0")
    return sorted(name for name in tracked if name and is_allowed_path(name))


def line_of(text, position):
    return text.count("\n", 0, position) + 1


def extract_references(relative, text):
    references, dynamic = [], {kind: 0 for kind in PATTERNS}
    for kind, pattern in PATTERNS.items():
        for match in pattern.finditer(text):
            references.append({"kind": kind, "name": match.group(2), "source": relative,
                               "line": line_of(text, match.start()), "confidence": "LITERAL"})
        dynamic[kind] = len(DYNAMIC_PATTERNS.get(kind, re.compile("(?!x)x")).findall(text))
    for match in KEY_ARRAY.finditer(text):
        kind = "query_key" if match.group(1) == "queryKey" else "mutation_key"
        residue = STATIC_KEY_TOKEN.sub("", match.group(2)).strip(" \t\r\n,")
        if residue:
            dynamic[kind] += 1
    return references, dynamic


def edge_function_names(root=ROOT):
    return {path.parent.name for path in (root / "supabase/functions").glob("*/index.ts")}


def correlate(references, catalog, edge_names):
    relation_names = {item["name"].split(".")[-1] for item in catalog["objects"]
                      if item["kind"] in {"table", "view"}}
    function_names = {item["name"].split(".")[-1] for item in catalog["objects"]
                      if item["kind"] == "function"}
    for reference in references:
        if reference["kind"] == "relation":
            reference["catalog_match"] = reference["name"] in relation_names
            reference["catalog_scope"] = "histórico de migrations"
        elif reference["kind"] == "rpc":
            reference["catalog_match"] = reference["name"] in function_names
            reference["catalog_scope"] = "histórico de migrations"
        elif reference["kind"] == "edge_function":
            reference["catalog_match"] = reference["name"] in edge_names
            reference["catalog_scope"] = "árvore versionada de Edge Functions"
        else:
            reference["catalog_match"] = None
            reference["catalog_scope"] = "não aplicável"
    return references


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-root", type=Path, default=ROOT / "graphify-out" / "code-references")
    args = parser.parse_args()
    if args.output_root.is_symlink():
        parser.exit(1, "Diretório de saída não pode ser link simbólico.\n")
    args.output_root.mkdir(parents=True, exist_ok=True)
    run = Path(tempfile.mkdtemp(prefix="execucao-", dir=args.output_root))
    run.chmod(0o700)
    evidence = {"status": "iniciado", "timestamp": datetime.now(timezone.utc).isoformat(),
                "mode": "Análise lexical estática; sem banco; sem execução de código"}
    atomic_write_json(run / "evidencia.json", evidence)
    try:
        evidence["commit"] = command(["git", "rev-parse", "HEAD"], ROOT).strip()
        references, imports, dynamic, hashes, credential_like = [], [], {kind: 0 for kind in PATTERNS}, {}, []
        files = source_files()
        tracked = set(command(["git", "ls-files", "-z"], ROOT).split("\0"))
        for relative in files:
            content = (ROOT / relative).read_bytes()
            text = content.decode("utf-8")
            if "\0" in text:
                raise ValueError(f"Código binário inesperado: {relative}")
            if SECRET.search(text):
                credential_like.append(relative)
            hashes[relative] = hashlib.sha256(content).hexdigest()
            found, found_dynamic = extract_references(relative, text)
            references.extend(found)
            imports.extend(extract_imports(relative, text))
            for kind, count in found_dynamic.items():
                dynamic[kind] += count
        catalog = migration_inventory()
        correlate(references, catalog, edge_function_names())
        resolve_imports(imports, tracked)
        unmatched = {kind: sum(1 for item in references if item["kind"] == kind and item["catalog_match"] is False)
                     for kind in ("relation", "rpc", "edge_function")}
        import_resolution = {status: sum(1 for item in imports if item["resolution"] == status)
                             for status in ("RESOLVED", "EXTERNAL", "MISSING")}
        evidence.update({"status": "validado_com_limitacoes", "files": len(files), "hashes": hashes,
                         "references": len(references), "dynamic_calls": dynamic, "unmatched": unmatched,
                         "imports": len(imports), "import_resolution": import_resolution,
                         "credential_like_files": credential_like,
                         "limitations": [
                             "Imports e argumentos literais são análise lexical; comentários e sintaxe incomum podem exigir confirmação AST.",
                             "Chamadas dinâmicas são contadas, não resolvidas.",
                             "Catálogo SQL é histórico lexical, não estado do banco canônico nem prova de deploy.",
                             "Match ausente é investigação, não erro: pode ser schema externo, migration posterior ou construção dinâmica.",
                         ]})
        (run / "referencias-codigo.json").write_text(json.dumps({
            "references": references, "imports": imports, "dynamic_calls": dynamic,
            "import_resolution": import_resolution, "unmatched": unmatched
        }, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps({"files": len(files), "references": len(references), "imports": len(imports),
                          "import_resolution": import_resolution, "dynamic": dynamic,
                          "unmatched": unmatched, "credential_like_files": len(credential_like)}, ensure_ascii=False))
        print(f"Referências: {run / 'referencias-codigo.json'}")
    except Exception:
        evidence["status"] = "falhou"
        raise
    finally:
        atomic_write_json(run / "evidencia.json", evidence)


if __name__ == "__main__":
    main()
