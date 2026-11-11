"""Inventário lexical de migrations PostgreSQL; não conecta nem executa SQL."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import tempfile
from datetime import datetime, timezone

from run import ROOT, SECRET, atomic_write_json, command


MIGRATIONS = ROOT / "supabase" / "migrations"
# Identificador simples ou entre aspas (aspas admitem espaço e hífen), com schema opcional.
IDENT = r'(?:"(?:[^"]|"")+"|[\w$]+)'
NAME = rf"({IDENT}(?:\.{IDENT})*)"
OBJECT_PATTERNS = (
    ("table", re.compile(rf"^\s*CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?{NAME}", re.I)),
    ("view", re.compile(rf"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?{NAME}", re.I)),
    ("function", re.compile(rf"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+{NAME}\s*\(([^)]*)\)", re.I | re.S)),
    ("index", re.compile(rf"^\s*CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?{NAME}\s+ON\s+(?:ONLY\s+)?{NAME}", re.I)),
    ("policy", re.compile(rf"^\s*CREATE\s+POLICY\s+{NAME}\s+ON\s+{NAME}", re.I)),
    ("trigger", re.compile(rf"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:CONSTRAINT\s+)?TRIGGER\s+{NAME}.*?\sON\s+{NAME}", re.I | re.S)),
    ("enum", re.compile(rf"^\s*CREATE\s+TYPE\s+{NAME}\s+AS\s+ENUM\b", re.I)),
    ("extension", re.compile(rf"^\s*CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?{NAME}", re.I)),
    ("alter_table", re.compile(rf"^\s*ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?{NAME}", re.I)),
    # TABLE é opcional no GRANT; sem palavra-chave, só não é tabela se vier outro tipo de objeto.
    ("grant", re.compile(
        r"^\s*GRANT\s+.+?\s+ON\s+(?:(?:TABLE|FUNCTION|SEQUENCE|ALL\s+TABLES\s+IN\s+SCHEMA)\s+"
        r"|(?!(?:SCHEMA|ALL|ROUTINE|PROCEDURE|TYPE|DOMAIN|DATABASE|LANGUAGE|FOREIGN|LARGE|PARAMETER|TABLESPACE)\b))"
        rf"(.+?)\s+TO\s+{NAME}", re.I | re.S)),
    ("job", re.compile(r"\b(?:cron\.schedule|pg_cron\.schedule)\s*\(\s*'([^']+)'", re.I)),
)
TABLE_CONTEXT = re.compile(rf"^\s*(?:CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?|ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?){NAME}", re.I)
FOREIGN_REFERENCE = re.compile(rf"\bREFERENCES\s+{NAME}", re.I)
TRIGGER_DEPENDENCY = re.compile(
    rf"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?(?:CONSTRAINT\s+)?TRIGGER\s+{NAME}.*?\sON\s+{NAME}.*?"
    rf"EXECUTE\s+(?:FUNCTION|PROCEDURE)\s+{NAME}", re.I | re.S)
POLICY_DEPENDENCY = re.compile(rf"^\s*CREATE\s+POLICY\s+{NAME}\s+ON\s+{NAME}", re.I | re.S)
FUNCTION_CONTEXT = re.compile(rf"^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+{NAME}", re.I)
RELATION_USE = re.compile(r"\b(?:FROM|JOIN|UPDATE|INSERT\s+INTO|DELETE\s+FROM)\s+([\w.\"]+)", re.I)
# IS [NOT] DISTINCT FROM é operador e FOR UPDATE é trava de linha: nenhum dos dois nomeia relação.
NOT_A_RELATION = re.compile(r"\b(?:DISTINCT|FOR)\s+$", re.I)
DOLLAR_TAG = re.compile(r"\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$")
DO_BLOCK = re.compile(r"DO\b", re.I)
LITERAL = re.compile(r"--[^\n]*|/\*.*?\*/|'(?:[^']|'')*'|\$((?:[A-Za-z_][A-Za-z_0-9]*)?)\$.*?\$\1\$", re.S)
# DDL condicional de um bloco DO: abre a linha ou vem logo após BEGIN/THEN/ELSE/LOOP.
NESTED_DDL = re.compile(r"(?:^[ \t]*|\b(?:BEGIN|THEN|ELSE|LOOP)\s+)(?=(?:CREATE|ALTER\s+TABLE|GRANT)\b)", re.I | re.M)
CTE_ALIAS = re.compile(
    r"(?:\bWITH\b|,)\s*(?:RECURSIVE\s+)?([A-Za-z_][A-Za-z0-9_$]*|\"[^\"]+\")"
    r"\s*(?:\([^)]*\)\s*)?AS\s+(?:(?:NOT\s+)?MATERIALIZED\s+)?\(", re.I
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
            if char == "'":
                # E'...' aceita \' como aspa escapada; colado em identificador (LIKE'x') é string comum.
                escaped = text[index - 1:index] in ("E", "e") and not is_identifier_char(text[index - 2:index - 1])
                state = "escape" if escaped else "single"; index += 1; continue
            # Colado em identificador, '$' pertence a ele (a$b$c), não abre dollar-quote.
            match = None if is_identifier_char(text[index - 1:index]) else DOLLAR_TAG.match(text, index)
            if match: tag = match.group(0); state = "dollar"; index += len(tag); continue
            if char == ";": items.append(text[start:index + 1]); start = index + 1
        elif state == "line" and char == "\n": state = "code"
        elif state == "block" and pair == "*/": state = "code"; index += 2; continue
        elif state == "double":
            if pair == '""': index += 2; continue
            if char == '"': state = "code"
        elif state in ("single", "escape"):
            if pair == "''" or (state == "escape" and char == "\\"): index += 2; continue
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


def is_identifier_char(char):
    return char.isalnum() or char in ("_", "$")


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


def balanced_arguments(body, opening):
    """Texto entre o parêntese em `opening` e o seu par; None se não fechar."""
    depth, quote = 0, None
    for index in range(opening, len(body)):
        char = body[index]
        if quote:
            quote = None if char == quote else quote
        elif char in "'\"":
            quote = char
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return body[opening + 1:index]
    return None


def ddl_statements(text):
    """Gera (corpo, deslocamento, aninhado) por statement, descendo um nível em blocos DO.

    CREATE TYPE/POLICY/VIEW idempotentes vivem em DO $$ ... $$ e ficavam fora do catálogo.
    SQL montado em EXECUTE continua de fora: é literal de string, resolvido só em execução.
    """
    offset = 0
    for statement in split_statements(text):
        trivia = skip_leading_trivia(statement)
        body, start = statement[trivia:], offset + trivia
        offset += len(statement)
        yield body, start, False
        opening = DOLLAR_TAG.search(body) if DO_BLOCK.match(body) else None
        closing = body.find(opening.group(0), opening.end()) if opening else -1
        if closing == -1:
            continue
        inner_start = start + opening.end()
        try:
            inner_statements = split_statements(body[opening.end():closing])
        except ValueError:
            continue
        for inner in inner_statements:
            # A busca ignora strings e comentários: 'CREATE ...' dentro de format() não é DDL estático.
            code = LITERAL.sub(lambda match: re.sub(r"[^\n]", " ", match.group(0)), inner)
            ddl = NESTED_DDL.search(code)
            if ddl:
                yield inner[ddl.end():], inner_start + ddl.end(), True
            inner_start += len(inner)


def objects_in_file(relative, text):
    objects = []
    for body, start, nested in ddl_statements(text):
        for kind, pattern in OBJECT_PATTERNS:
            match = pattern.search(body)
            if not match or (nested and kind == "job"):
                continue
            name = clean_name(match.group(1))
            details = {}
            if kind in {"function", "index", "policy", "trigger", "grant"} and match.lastindex and match.lastindex >= 2:
                details["target"] = clean_name(match.group(2))
            if kind == "function":
                # [^)]* para no primeiro ')': DEFAULT now() ou numeric(10,2) truncavam a assinatura.
                arguments = balanced_arguments(body, match.start(2) - 1)
                if arguments is not None:
                    details["target"] = clean_name(arguments)
            if nested:
                details["do_block"] = True
            objects.append({"kind": kind, "name": name, "migration": relative,
                            "line": line_of(text, start + match.start(1)), "details": details,
                            "confidence": "LEXICAL"})
            break
    return objects


def dependencies_in_file(relative, text):
    """Extrai dependências SQL qualificadas com confiança lexical explícita."""
    dependencies = []
    for body, start, _nested in ddl_statements(text):
        table = TABLE_CONTEXT.search(body)
        if table:
            for match in FOREIGN_REFERENCE.finditer(body):
                dependencies.append({
                    "kind": "foreign_key", "source": clean_name(table.group(1)),
                    "target": clean_name(match.group(1)), "migration": relative,
                    "line": line_of(text, start + match.start(1)), "confidence": "LEXICAL",
                })
        trigger = TRIGGER_DEPENDENCY.search(body)
        if trigger:
            dependencies.append({
                "kind": "trigger_function", "source": clean_name(trigger.group(2)),
                "target": clean_name(trigger.group(3)), "via": clean_name(trigger.group(1)),
                "migration": relative, "line": line_of(text, start + trigger.start(3)),
                "confidence": "LEXICAL",
            })
        policy = POLICY_DEPENDENCY.search(body)
        if policy:
            dependencies.append({
                "kind": "policy_table", "source": clean_name(policy.group(1)),
                "target": clean_name(policy.group(2)), "migration": relative,
                "line": line_of(text, start + policy.start(2)), "confidence": "LEXICAL",
            })
        function = FUNCTION_CONTEXT.search(body)
        if function:
            source = clean_name(function.group(1))
            cte_aliases = {clean_name(match.group(1)).casefold() for match in CTE_ALIAS.finditer(body)}
            for match in RELATION_USE.finditer(body):
                target = clean_name(match.group(1))
                if target.casefold() in {"select", "values", "set", "lateral"} | cte_aliases:
                    continue
                if NOT_A_RELATION.search(body, max(0, match.start() - 24), match.start()):
                    continue
                dependencies.append({
                    "kind": "function_relation", "source": source, "target": target,
                    "migration": relative, "line": line_of(text, start + match.start(1)),
                    "confidence": "LEXICAL_LOW",
                })
    return dependencies


def inventory(root=ROOT):
    migrations = Path(root) / "supabase" / "migrations"
    files = sorted(migrations.glob("*.sql"))
    if not files:
        raise ValueError("Nenhuma migration SQL encontrada.")
    objects, dependencies, hashes, credential_like = [], [], {}, []
    for path in files:
        relative = path.relative_to(Path(root)).as_posix()
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
        dependencies.extend(dependencies_in_file(relative, text))
    counts = {}
    for item in objects:
        counts[item["kind"]] = counts.get(item["kind"], 0) + 1
    dependency_counts = dict(Counter(item["kind"] for item in dependencies))
    return {"migration_files": len(files), "objects": objects, "counts": counts,
            "dependencies": dependencies, "dependency_counts": dependency_counts, "hashes": hashes,
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
                "mode": "Inventário lexical de migrations; sem banco; sem execução SQL"}
    atomic_write_json(run / "evidencia.json", evidence)
    try:
        evidence["commit"] = command(["git", "rev-parse", "HEAD"], ROOT).strip()
        result = inventory()
        evidence.update({"status": "validado_com_limitacoes", "migration_files": result["migration_files"],
                         "counts": result["counts"], "hashes": result["hashes"],
                         "dependency_counts": result["dependency_counts"],
                         "credential_like_migrations": result["credential_like_migrations"],
                         "limitations": [
                             "Não é parser PostgreSQL completo; objetos não reconhecidos ficam fora do catálogo.",
                             "Migrations declaradas não comprovam aplicação no banco canônico.",
                             "Objetos alterados/removidos exigem leitura ordenada do histórico e catálogo real.",
                         ]})
        (run / "catalogo-migrations.json").write_text(json.dumps({
            "migration_files": result["migration_files"], "counts": result["counts"],
            "objects": result["objects"], "dependency_counts": result["dependency_counts"],
            "dependencies": result["dependencies"]
        }, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps({"migrations": result["migration_files"], "objects": len(result["objects"]),
                          "counts": result["counts"], "dependencies": result["dependency_counts"],
                          "credential_like_migrations": len(result["credential_like_migrations"])}, ensure_ascii=False))
        print(f"Catálogo: {run / 'catalogo-migrations.json'}")
    except Exception:
        evidence["status"] = "falhou"
        raise
    finally:
        atomic_write_json(run / "evidencia.json", evidence)


if __name__ == "__main__":
    main()
