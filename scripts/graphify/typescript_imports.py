"""Inventaria imports TypeScript sem executar módulos ou resolver pacotes externos."""

from pathlib import PurePosixPath
import posixpath
import re


IMPORT_PATTERNS = (
    ("type_import", re.compile(r"\bimport\s+type\s+[^;]+?\s+from\s*(['\"])([^'\"]+)\1")),
    ("static_import", re.compile(r"\bimport\s+(?!type\b|['\"])[^;]+?\s+from\s*(['\"])([^'\"]+)\1")),
    ("side_effect_import", re.compile(r"\bimport\s*(['\"])([^'\"]+)\1")),
    ("reexport", re.compile(r"\bexport\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from\s*(['\"])([^'\"]+)\1")),
    ("lazy_import", re.compile(r"\bimport\s*\(\s*(['\"])([^'\"]+)\1\s*\)")),
)
SOURCE_SUFFIXES = (".ts", ".tsx", ".js", ".jsx")


def line_of(text, position):
    return text.count("\n", 0, position) + 1


def extract_imports(relative, text):
    found, occupied = [], set()
    for kind, pattern in IMPORT_PATTERNS:
        for match in pattern.finditer(text):
            span = range(match.start(), match.end())
            if any(position in occupied for position in span):
                continue
            occupied.update(span)
            found.append({
                "kind": kind,
                "specifier": match.group(2),
                "source": relative,
                "line": line_of(text, match.start()),
                "confidence": "LEXICAL",
            })
    return sorted(found, key=lambda item: (item["line"], item["kind"], item["specifier"]))


def candidate_paths(relative, specifier):
    if specifier.startswith("@/"):
        base = PurePosixPath("src") / specifier[2:]
    elif specifier.startswith("."):
        base = PurePosixPath(relative).parent / specifier
    else:
        return []
    normalized = PurePosixPath(posixpath.normpath(base.as_posix()))
    if (not normalized.parts or normalized.is_absolute() or ".." in normalized.parts
            or normalized.parts[0] not in {"src", "supabase"}):
        return []
    candidates = [normalized]
    if normalized.suffix not in SOURCE_SUFFIXES:
        candidates.extend(PurePosixPath(str(normalized) + suffix) for suffix in SOURCE_SUFFIXES)
        candidates.extend(normalized / ("index" + suffix) for suffix in SOURCE_SUFFIXES)
    return [candidate.as_posix() for candidate in candidates]


def resolve_imports(imports, tracked):
    tracked = set(tracked)
    for item in imports:
        candidates = candidate_paths(item["source"], item["specifier"])
        if not candidates:
            item["resolution"] = "EXTERNAL"
            item["target"] = None
            continue
        target = next((candidate for candidate in candidates if candidate in tracked), None)
        item["resolution"] = "RESOLVED" if target else "MISSING"
        item["target"] = target
    return imports
