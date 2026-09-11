"""Inventário lexical de migrations PostgreSQL; não conecta nem executa SQL."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import tempfile
from datetime import datetime, timezone

from run import ROOT, SECRET, command


MIGRATIONS = ROOT / "supabase" / "migrations"
OBJECT_PATTERNS = (
    ("table", re.compile(r"^\s*CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.\"]+)", re.I)),
    ("view", re.compile(r"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+([\w.\"]+)", re.I)),
    ("function", re.compile(r"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([\w.\"]+)\s*\(([^)]*)\)", re.I | re.S)),
    ("index", re.compile(r"^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([\w.\"]+)\s+ON\s+([\w.\"]+)", re.I)),
    ("policy", re.compile(r"^\s*CREATE\s+POLICY\s+([\w.\"]+)\s+ON\s+([\w.\"]+)", re.I)),
    ("trigger", re.compile(r"^\s*CREATE\s+(?:CONSTRAINT\s+)?TRIGGER\s+([\w.\"]+).*?\sON\s+([\w.\"]+)", re.I | re.S)),
    ("enum", re.compile(r"^\s*CREATE\s+TYPE\s+([\w.\"]+)\s+AS\s+ENUM\b", re.I)),
    ("extension", re.compile(r"^\s*CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.\"]+)", re.I)),
    ("alter_table", re.compile(r"^\s*ALTER\s+TABLE\s+(?:ONLY\s+)?([\w.\"]+)", re.I)),
    ("grant", re.compile(r"^\s*GRANT\s+.+?\s+ON\s+(?:TABLE|FUNCTION|SEQUENCE|ALL\s+TABLES\s+IN\s+SCHEMA)\s+(.+?)\s+TO\s+([\w.\"]+)", re.I | re.S)),
    ("job", re.compile(r"\b(?:cron\.schedule|pg_cron\.schedule)\s*\(\s*'([^']+)'", re.I)),
)


def split_statements(text):
    """Divide em ';' apenas fora de comentários, strings e dollar-quoting."""
    items, start, index, state, tag = [], 0, 0, "code", None
    while index < len(text):
        pair = text[index:index + 2]
        char = text[index]
        if state == "code":
            if pair == "--": state = "line"; index += 2; continue
            if pair == "/*": state = "block"; index += 2; continue
            if char == '"': state = "double"; index += 1; continue
            if char == "'": state = "single"; index += 1; continue
            match = re.match(r"\$[A-Za-z_0-9]*\$", text[index:])
            if match: tag = match.group(0); state = "dollar"; index += len(tag); continue
            if char == ";": items.append(text[start:index + 1]); start = index + 1
        elif state == "line" and char == "\n": state = "code"
        elif state == "block" and pair == "*/": state = "code"; index += 2; continue
        elif state == "double":
            if pair == '""': index += 2; continue
            if char == '"': state = "code"
        elif state == "single":
            if pair == "''": index += 2; continue
            if char == "'": state = "code"
        elif state == "dollar" and text.startswith(tag, index):
            state = "code"; index += len(tag); continue
        index += 1
    if state == "line":
        state = "code"
    if state != "code":
        raise ValueError("SQL com string, comentário ou dollar-quote não fechado.")
    if text[start:].strip():
        items.append(text[start:])
    return [item for item in items if re.sub(r"--[^\n]*|/\*.*?\*/", "", item, flags=re.S).strip()]


def line_of(text, offset):
    return text.count("\n", 0, offset) + 1


def clean_name(name):
    return name.strip().replace('"', '')


def skip_leading_trivia(statement):
    """Retorna início do primeiro token SQL, mantendo o deslocamento original."""
    index = 0
    while index < len(statement):
        while index < len(statement) and statement[index].isspace():
            index += 1
        if statement.startswith("--", index):
            newline = statement.find("\n", index)
            index = len(statement) if newline == -1 else newline + 1
            continue
        if statement.startswith("/*", index):
            end = statement.find("*/", index + 2)
            if end == -1:
                raise ValueError("Comentário de bloco não fechado.")
            index = end + 2
            continue
        break
    return index


def objects_in_file(relative, text):
    objects = []
    offset = 0
    for statement in split_statements(text):
        trivia = skip_leading_trivia(statement)
        body = statement[trivia:]
        for kind, pattern in OBJECT_PATTERNS:
            match = pattern.search(body)
            if not match:
                continue
            name = clean_name(match.group(1))
            details = {}
            if kind in {"function", "index", "policy", "trigger", "grant"} and match.lastindex and match.lastindex >= 2:
                details["target"] = clean_name(match.group(2))
            objects.append({"kind": kind, "name": name, "migration": relative,
                            "line": line_of(text, offset + trivia + match.start(1)), "details": details,
                            "confidence": "LEXICAL"})
            break
        offset += len(statement)
    return objects


def inventory(root=ROOT):
    files = sorted(MIGRATIONS.glob("*.sql"))
    if not files:
        raise ValueError("Nenhuma migration SQL encontrada.")
    objects, hashes, credential_like = [], {}, []
    for path in files:
        relative = path.relative_to(root).as_posix()
        content = path.read_bytes()
        text = content.decode("utf-8")
        if "\0" in text:
            raise ValueError(f"Migration com conteúdo binário: {relative}")
        if SECRET.search(text):
            # O parser permanece local e nunca salva statements; registrar só a
            # localização permite abrir incidente sem replicar o literal sensível.
            credential_like.append(relative)
        hashes[relative] = hashlib.sha256(content).hexdigest()
        objects.extend(objects_in_file(relative, text))
    counts = {}
    for item in objects:
        counts[item["kind"]] = counts.get(item["kind"], 0) + 1
    return {"migration_files": len(files), "objects": objects, "counts": counts, "hashes": hashes,
            "credential_like_migrations": credential_like}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-root", type=Path, default=ROOT / "graphify-out" / "schema-migrations")
    args = parser.parse_args()
    output = args.output_root
    if output.is_symlink():
        parser.exit(1, "Diretório de saída não pode ser link simbólico.\n")
    output.mkdir(parents=True, exist_ok=True)
    run = Path(tempfile.mkdtemp(prefix="execucao-", dir=output))
    run.chmod(0o700)
    evidence = {"status": "iniciado", "timestamp": datetime.now(timezone.utc).isoformat(),
                "commit": command(["git", "rev-parse", "HEAD"], ROOT).strip(),
                "mode": "Inventário lexical de migrations; sem banco; sem execução SQL"}
    try:
        result = inventory()
        evidence.update({"status": "validado_com_limitacoes", "migration_files": result["migration_files"],
                         "counts": result["counts"], "hashes": result["hashes"],
                         "credential_like_migrations": result["credential_like_migrations"],
                         "limitations": [
                             "Não é parser PostgreSQL completo; objetos não reconhecidos ficam fora do catálogo.",
                             "Migrations declaradas não comprovam aplicação no banco canônico.",
                             "Objetos alterados/removidos exigem leitura ordenada do histórico e catálogo real.",
                         ]})
        (run / "catalogo-migrations.json").write_text(json.dumps({
            "migration_files": result["migration_files"], "counts": result["counts"], "objects": result["objects"]
        }, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps({"migrations": result["migration_files"], "objects": len(result["objects"]),
                          "counts": result["counts"], "credential_like_migrations": len(result["credential_like_migrations"])}, ensure_ascii=False))
        print(f"Catálogo: {run / 'catalogo-migrations.json'}")
    except Exception:
        evidence["status"] = "falhou"
        raise
    finally:
        (run / "evidencia.json").write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
